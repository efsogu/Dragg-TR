import { expect, test, type Page } from "@playwright/test";

import { createTestUser } from "./fixtures/test-user";

async function createTransaction(page: Page, description: string) {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Add Transaction" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.locator("#amount").pressSequentially("1234");
  await dialog.getByRole("button", { name: /Market & Gıda$/ }).click();
  await dialog.locator("#description").fill(description);
  await dialog.getByRole("button", { name: "Nakit", exact: true }).click();
  await dialog.getByRole("button", { name: "Save transaction" }).click();

  await expect(page.getByText("Transaction recorded successfully!")).toBeVisible();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
}

async function deleteTransaction(page: Page, description: string) {
  const rowButton = page.getByRole("button", { name: description });
  await rowButton.locator("xpath=following-sibling::button[1]").click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByText(description, { exact: true })).toHaveCount(0);
}

test("RLS keeps two authenticated users' transactions mutually isolated", async ({
  page,
  browser,
}) => {
  const firstDescription = `RLS user A ${Date.now()}`;
  const secondDescription = `RLS user B ${Date.now()}`;

  await createTransaction(page, firstDescription);
  const baseURL = new URL(page.url()).origin;
  const secondContext = await browser.newContext({ baseURL });

  try {
    const secondPage = await secondContext.newPage();
    const response = await secondPage.request.post(`${baseURL}/api/e2e-auth`, {
      data: createTestUser(),
    });
    expect(response.status()).toBe(201);

    await secondPage.goto("/transactions");
    await expect(secondPage).toHaveURL(/\/transactions/);
    await expect(secondPage.getByText(firstDescription, { exact: true })).toHaveCount(0);

    await createTransaction(secondPage, secondDescription);

    await page.reload();
    await expect(page.getByText(secondDescription, { exact: true })).toHaveCount(0);

    await deleteTransaction(secondPage, secondDescription);
  } finally {
    await secondContext.close();
  }

  await deleteTransaction(page, firstDescription);
});
