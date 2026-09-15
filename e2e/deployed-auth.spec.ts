import { expect, test } from "@playwright/test";

async function selectLanguage(
  page: import("@playwright/test").Page,
  language: "English" | "Türkçe",
) {
  await page
    .getByRole("combobox", { name: /^(Language|Dil|Idioma)$/ })
    .click();
  await page.getByRole("option", { name: language, exact: true }).click();
}

async function verifyGoogleOnlyUi(
  page: import("@playwright/test").Page,
  projectName: string,
) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  await expect(page.locator("#auth-password")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Forgot password?" })).toHaveCount(0);

  await selectLanguage(page, "Türkçe");
  await expect(page.getByRole("heading", { name: "Giriş yap" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Google ile devam et" }),
  ).toBeVisible();

  await selectLanguage(page, "English");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  if (projectName !== "chromium") {
    console.log(`DEPLOYED_SMOKE_GOOGLE_ONLY_UI_PASS=${projectName}`);
    return;
  }

  await page.getByRole("button", { name: "Continue with Google" }).click();
  const result = await expect
    .poll(
      async () => {
        if (/accounts\.google\.com/.test(page.url())) return "google-redirect";

        const body = await page.locator("body").innerText().catch(() => "");
        if (body.includes("Unsupported provider: provider is not enabled")) {
          return "provider-disabled";
        }

        return "pending";
      },
      { timeout: 15_000 },
    )
    .not.toBe("pending")
    .then(async () => {
      if (/accounts\.google\.com/.test(page.url())) return "google-redirect";
      const body = await page.locator("body").innerText().catch(() => "");
      if (body.includes("Unsupported provider: provider is not enabled")) {
        return "provider-disabled";
      }
      return "unknown";
    });

  if (result === "provider-disabled") {
    throw new Error(
      "Hosted Google OAuth provider is disabled in Supabase. Enable the Google provider before merge.",
    );
  }

  expect(result).toBe("google-redirect");
  console.log("DEPLOYED_SMOKE_GOOGLE_ONLY_UI_PASS=chromium");
  console.log("DEPLOYED_SMOKE_GOOGLE_OAUTH=redirect-started");
}

test("deployed Google-only auth smoke", async ({ page }, testInfo) => {
  await verifyGoogleOnlyUi(page, testInfo.project.name);
});
