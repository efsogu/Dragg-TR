import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { acceptTermsAction } from "@/app/auth/accept-terms/actions";

function acceptedTermsForm() {
  const formData = new FormData();
  formData.set("acceptTerms", "true");
  return formData;
}

function mockSupabase(
  user: { id: string } | null,
  rpcError: Error | null = null,
) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: rpcError });

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    rpc,
  };
}

describe("acceptTermsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed when the submitted form does not explicitly accept the terms", async () => {
    await expect(acceptTermsAction(new FormData())).rejects.toThrow(
      "Terms acceptance is required",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("redirects home when there is no authenticated user", async () => {
    const supabase = mockSupabase(null);
    createClient.mockResolvedValue(supabase);

    await expect(acceptTermsAction(acceptedTermsForm())).rejects.toThrow(
      "REDIRECT:/",
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("records acceptance through the hardened RPC and redirects to the dashboard", async () => {
    const supabase = mockSupabase({ id: "user-1" });
    createClient.mockResolvedValue(supabase);

    await expect(acceptTermsAction(acceptedTermsForm())).rejects.toThrow(
      "REDIRECT:/dashboard",
    );

    expect(supabase.rpc).toHaveBeenCalledWith("accept_terms");
  });

  it("does not redirect to the dashboard when persistence fails", async () => {
    const supabase = mockSupabase({ id: "user-1" }, new Error("db"));
    createClient.mockResolvedValue(supabase);

    await expect(acceptTermsAction(acceptedTermsForm())).rejects.toThrow(
      "Unable to record terms acceptance",
    );
  });
});
