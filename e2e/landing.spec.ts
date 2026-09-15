import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("renders the Google-only sign-in card", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();

    await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
    await expect(page.locator("#auth-password")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Forgot password?" }),
    ).toHaveCount(0);
  });

  test("keeps signup terms out of the pre-auth screen", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Terms of Use" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  });
});

test.describe("landing page locale detection", () => {
  test.use({ locale: "pt-BR" });

  test("renders Portuguese copy when the browser locale is pt-BR", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText("Finanças pessoais, open source e gratuito."),
    ).toBeVisible();
  });
});

test.describe("landing page theme detection", () => {
  test.use({ colorScheme: "dark" });

  test("applies dark mode when the system prefers dark", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("landing page theme detection (light)", () => {
  test.use({ colorScheme: "light" });

  test("applies light mode when the system prefers light", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
