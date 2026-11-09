import { performance } from "node:perf_hooks";
import { createImporter } from "../dist/index.js";

const importer = createImporter({
  columns: [
    { key: "id", label: "ID", required: true },
    { key: "email", label: "Email", required: true },
    { key: "name", label: "Name", required: true },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
  ],
  duplicateKeys: ["id", "email"],
});

function createRows(count) {
  return Array.from({ length: count }, (_, index) => ({
    ID: String(index + 1),
    Email: "user" + (index + 1) + "@example.test",
    Name: "User " + (index + 1),
    Amount: String((index % 1000) * 1.25),
    Status: index % 2 === 0 ? "active" : "inactive",
  }));
}

// Warm up the same code path before collecting measurements.
importer.processRows(createRows(2_000));

for (const count of [10_000, 50_000, 100_000]) {
  const rows = createRows(count);
  const start = performance.now();
  const result = importer.processRows(rows);
  const elapsedMs = performance.now() - start;
  const rowsPerSecond = Math.round(count / (elapsedMs / 1_000));

  console.log(
    count.toLocaleString() + " rows: " +
    elapsedMs.toFixed(1) + " ms; " +
    rowsPerSecond.toLocaleString() + " rows/sec; " +
    result.validCount.toLocaleString() + " valid; " +
    result.invalidCount.toLocaleString() + " invalid",
  );
}
