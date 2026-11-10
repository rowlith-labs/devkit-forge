import { expect, test } from "@playwright/test";

test("loads a CSV, validates rows, and emits component events", async ({ page }) => {
  await page.goto("/");
  const importer = page.locator("df-data-importer");

  await importer.locator('input[data-file]').setInputFiles({
    name: "contacts.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      "Name,Email",
      "Ada Lovelace,ada@example.com",
      "Grace Hopper,not-an-email",
      "Duplicate Ada,ada@example.com",
    ].join("\n")),
  });

  const report = page.locator("#report");
  await expect(report).toContainText("Rows: 3");
  await importer.locator("button[data-validate]").click();
  await expect(report).toContainText("Processed: 3");
  await expect(report).toContainText("Valid: 1");
  await expect(report).toContainText("Invalid: 2");
});
