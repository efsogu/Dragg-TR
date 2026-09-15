import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient,
  exchangeCodeForSession,
  maybeSingle,
  setSession,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi
    .fn()
    .mockResolvedValue({ data: { session: null }, error: null }),
  maybeSingle: vi
    .fn()
    .mockResolvedValue({ data: { terms_accepted: true }, error: null }),
  setSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { GET } from "@/app/auth/callback/route";

function createSupabaseMock() {
  return {
    auth: { exchangeCodeForSession, setSession },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    })),
  };
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { terms_accepted: true },
      error: null,
    });
    createClient.mockResolvedValue(createSupabaseMock());
  });

  it("exchanges the code and redirects to a safe next path when no session is returned", async () => {
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc123&next=/transactions",
    );

    const response = await GET(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123", undefined);
    expect(setSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/transactions",
    );
  });

  it("passes sb_flow_id through so the matching PKCE verifier cookie is cleaned up", async () => {
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc123&sb_flow_id=flow-xyz",
    );

    await GET(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123", {
      flowId: "flow-xyz",
    });
  });

  it("re-saves the session without provider tokens and preserves the requested path after accepted terms", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: "at-123",
          refresh_token: "rt-456",
          provider_token: "google-at",
          user: { id: "user-123" },
        },
      },
      error: null,
    });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc123&next=/transactions",
    );

    const response = await GET(request);

    expect(setSession).toHaveBeenCalledWith({
      access_token: "at-123",
      refresh_token: "rt-456",
    });
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(
      "http://localhost/transactions",
    );
  });

  it("redirects a new Google user to terms acceptance before dashboard access", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: "at-123",
          refresh_token: "rt-456",
          user: { id: "user-123" },
        },
      },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { terms_accepted: false },
      error: null,
    });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc123&next=/dashboard",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/accept-terms",
    );
  });

  it("fails closed to terms acceptance when the profile cannot be read", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: "at-123",
          refresh_token: "rt-456",
          user: { id: "user-123" },
        },
      },
      error: null,
    });
    maybeSingle.mockResolvedValue({ data: null, error: new Error("db") });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc123",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/accept-terms",
    );
  });

  it("skips the exchange and redirects to /dashboard when there is no code or next param", async () => {
    const request = new NextRequest("http://localhost/auth/callback");

    const response = await GET(request);

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("falls back to /dashboard when next points off-site", async () => {
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc123&next=//evil.com",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
