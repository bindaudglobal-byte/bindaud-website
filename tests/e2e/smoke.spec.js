const { test, expect } = require("@playwright/test");

test("homepage renders and key navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BIN DAUD/i);
  await expect(
    page.getByRole("heading", { name: /Premium Streetwear/i }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Shop Now/i })
    .first()
    .click();
  await expect(page).toHaveURL(/shop\.html/);
});

test("admin health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/admin/session");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty("success", true);
});
