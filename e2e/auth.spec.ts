import { expect, test } from "@playwright/test";

test("exposes Google-only authentication", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();

  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  await expect(page.locator("#auth-password")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Forgot password?" })).toHaveCount(0);
});

test("legacy password-update route returns to Google sign-in", async ({ page }) => {
  await page.goto("/auth/update-password");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
});
