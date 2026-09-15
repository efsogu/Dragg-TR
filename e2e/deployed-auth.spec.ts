import { expect, test } from "@playwright/test";

const email = "dragg-deployed-smoke@example.com";
const password = "Secure1!x";
const mode = process.env.DEPLOYED_SMOKE_MODE ?? "signup";

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

  await expect(async () => {
    const body = await page.locator("body").innerText();
    const completed =
      /\/dashboard(?:\/|$)/.test(page.url()) ||
      body.includes("Check your email to finish signing in.");
    expect(completed).toBe(true);
  }).toPass({ timeout: 20_000 });

  console.log(`DEPLOYED_SMOKE_EMAIL=${email}`);
  console.log(
    /\/dashboard(?:\/|$)/.test(page.url())
      ? "DEPLOYED_SMOKE_SIGNUP=immediate-session"
      : "DEPLOYED_SMOKE_SIGNUP=confirmation-required",
  );
}

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/, { timeout: 20_000 });
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
