import { expect, test as setup } from "@playwright/test";

import { createTestUser } from "../fixtures/test-user";

const authFile = "e2e/.auth/user.json";

setup("create local E2E user and save authenticated session", async ({ page }) => {
  const user = createTestUser();
  const response = await page.request.post("/api/e2e-auth", {
    data: user,
  });

  expect(response.status()).toBe(201);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await page.context().storageState({ path: authFile });
});
