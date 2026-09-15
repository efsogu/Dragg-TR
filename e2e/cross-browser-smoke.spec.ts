import { expect, test } from "@playwright/test";

test("authenticated finance shell works across supported browser profiles", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Total Income")).toBeVisible();
  await expect(page.getByText("Total Expenses")).toBeVisible();

  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/transactions/);
  await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();

  if (testInfo.project.name === "mobile-chromium-smoke") {
    await expect(page.getByRole("link", { name: "Transactions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "More" })).toBeVisible();
  }
});
