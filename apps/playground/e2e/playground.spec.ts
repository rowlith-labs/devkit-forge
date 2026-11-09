import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("loads sample data and reports valid and invalid rows", async ({ page }) => {
  await page.getByRole("button", { name: /load sample data/i }).click();
  await page.getByRole("button", { name: /validate 4 rows/i }).click();

  const stats = page.locator(".stat-card");
  await expect(stats.nth(0)).toContainText("4");
  await expect(stats.nth(1)).toContainText("2");
  await expect(stats.nth(2)).toContainText("2");
  await expect(page.getByRole("table")).toBeVisible();
});

test("keeps the file picker keyboard-focusable", async ({ page }) => {
  const input = page.locator('input[type="file"]');
  await input.focus();

  await expect(input).toBeFocused();
  await expect(page.locator("label.browse")).toHaveCSS("outline-style", "solid");
});

test("exports CSV formula-like values as inert text", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "formula-test.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,email,company\nAda,ada@example.com,=1+1\n"),
  });
  await page.getByRole("button", { name: /validate 1 rows/i }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export valid csv/i }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let content = "";
  for await (const chunk of stream ?? []) content += chunk.toString("utf8");

  expect(download.suggestedFilename()).toBe("valid-contacts.csv");
  expect(content).toContain("'=1+1");
});

test("rejects playground uploads larger than 10 MiB", async ({ page }) => {
  const tooLarge = Buffer.alloc(10 * 1024 * 1024 + 1, 65);
  await page.locator('input[type="file"]').setInputFiles({
    name: "too-large.csv",
    mimeType: "text/csv",
    buffer: tooLarge,
  });

  await expect(page.locator(".notice.warning")).toContainText("up to 10 MiB");
});
