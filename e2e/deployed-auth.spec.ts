import { expect, test } from "@playwright/test";

const email = "dragg-deployed-smoke@example.com";
const password = "Secure1!x";
const mode = process.env.DEPLOYED_SMOKE_MODE ?? "preauth";

async function selectLanguage(
  page: import("@playwright/test").Page,
  language: "English" | "Türkçe",
) {
  await page
    .getByRole("combobox", { name: /^(Language|Dil|Idioma)$/ })
    .click();
  await page.getByRole("option", { name: language, exact: true }).click();
}

async function signUp(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("First Name").fill("Dragg");
  await page.getByLabel("Last Name").fill("Deployed Smoke");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator("#auth-password").fill(password);
  await page.locator("#auth-confirm-password").fill(password);
  await page.locator("#auth-accept-terms").click();
  await page.getByRole("button", { name: "Sign up with email" }).click();

  const state = await expect
    .poll(
      async () => {
        if (/\/dashboard(?:\/|$)/.test(page.url())) return "immediate-session";
        const body = await page.locator("body").innerText();
        if (body.includes("Check your email to finish signing in.")) {
          return "confirmation-required";
        }
        const alerts = await page.getByRole("alert").allInnerTexts();
        const message = alerts.map((text) => text.trim()).find(Boolean);
        return message ? `error:${message}` : "pending";
      },
      { timeout: 20_000 },
    )
    .not.toBe("pending")
    .then(async () => {
      if (/\/dashboard(?:\/|$)/.test(page.url())) return "immediate-session";
      const body = await page.locator("body").innerText();
      if (body.includes("Check your email to finish signing in.")) {
        return "confirmation-required";
      }
      const alerts = await page.getByRole("alert").allInnerTexts();
      const message = alerts.map((text) => text.trim()).find(Boolean);
      return message ? `error:${message}` : "unknown";
    });

  if (state.startsWith("error:")) {
    throw new Error(`Hosted signup failed: ${state.slice("error:".length)}`);
  }

  expect(["immediate-session", "confirmation-required"]).toContain(state);
  console.log(`DEPLOYED_SMOKE_EMAIL=${email}`);
  console.log(`DEPLOYED_SMOKE_SIGNUP=${state}`);
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/, { timeout: 20_000 });
}

async function verifyPreAuth(
  page: import("@playwright/test").Page,
  projectName: string,
) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await selectLanguage(page, "Türkçe");
  await expect(page.getByRole("heading", { name: "Giriş yap" })).toBeVisible();

  await selectLanguage(page, "English");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  if (projectName !== "chromium") {
    console.log(`DEPLOYED_SMOKE_PREAUTH_PASS=${projectName}`);
    return;
  }

  await page.getByLabel("Email", { exact: true }).fill("no-such-user@example.com");
  await page.locator("#auth-password").fill("WrongPassword1!");
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect
    .poll(
      async () => {
        const oauthError = await page
          .getByText("Google sign-in could not be started.")
          .isVisible()
          .catch(() => false);
        if (oauthError) return "provider-error";
        if (/accounts\.google\.com/.test(page.url())) return "google-redirect";
        return "pending";
      },
      { timeout: 15_000 },
    )
    .toBe("google-redirect");

  console.log(`DEPLOYED_SMOKE_PREAUTH_PASS=${projectName}`);
  console.log("DEPLOYED_SMOKE_GOOGLE_OAUTH=redirect-started");
}

async function verifyTransactionCrud(page: import("@playwright/test").Page) {
  const description = `Deployed smoke ${Date.now()}`;
  const updatedDescription = `${description} updated`;

  await page.goto("/transactions");
  await page.evaluate(() => window.localStorage.setItem("dragg-currency", "TRY"));
  await page.reload();

  await page.getByRole("button", { name: "Add Transaction" }).click();
  const addDialog = page.getByRole("dialog");
  await expect(addDialog.getByText("₺", { exact: true })).toBeVisible();
  await addDialog.locator("#amount").pressSequentially("5000");
  await addDialog.getByRole("button", { name: /Market & Gıda$/ }).click();
  await addDialog.locator("#description").fill(description);
  await addDialog.getByRole("button", { name: "Nakit", exact: true }).click();
  await addDialog.getByRole("button", { name: "Save transaction" }).click();

  await expect(page.getByText("Transaction recorded successfully!")).toBeVisible();
  await expect(page.getByText(description, { exact: true })).toBeVisible();

  await page.getByText(description, { exact: true }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.locator("#transaction-description").fill(updatedDescription);
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Transaction updated successfully.")).toBeVisible();

  const rowButton = page.getByRole("button", { name: updatedDescription });
  await rowButton.locator("xpath=following-sibling::button[1]").click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();

  await expect(page.getByText("Transaction deleted successfully.")).toBeVisible();
  await expect(page.getByText(updatedDescription, { exact: true })).toHaveCount(0);
}

test("deployed auth smoke", async ({ page }, testInfo) => {
  if (mode === "preauth") {
    await verifyPreAuth(page, testInfo.project.name);
    return;
  }

  if (mode === "signup") {
    await signUp(page);
    return;
  }

  expect(mode).toBe("login");
  await signIn(page);

  if (testInfo.project.name === "chromium") {
    await verifyTransactionCrud(page);
  }

  console.log(`DEPLOYED_SMOKE_LOGIN_PASS=${testInfo.project.name}`);
});
