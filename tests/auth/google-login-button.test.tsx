import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOAuth },
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) =>
      ({
        "auth.continueWithGoogle": "Continue with Google",
        "auth.oauthError": "Unable to sign in with Google.",
      })[key] ?? key,
  }),
}));

import { GoogleLoginButton } from "@/components/auth/google-login-button";

describe("GoogleLoginButton", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
  });

  it("re-enables the button and shows an error when Supabase returns an OAuth error", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: new Error("provider disabled"),
    });
    const user = userEvent.setup();

    render(<GoogleLoginButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    await user.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to sign in with Google.",
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  });

  it("recovers from an unexpected OAuth exception instead of staying disabled", async () => {
    signInWithOAuth.mockRejectedValue(new Error("network failure"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    render(<GoogleLoginButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    await user.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to sign in with Google.",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Unable to start Google OAuth:",
      expect.any(Error),
    );
    consoleError.mockRestore();
  });

  it("keeps the button disabled while a successful OAuth redirect is taking over", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://example.com/oauth" },
      error: null,
    });
    const user = userEvent.setup();

    render(<GoogleLoginButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    await user.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
