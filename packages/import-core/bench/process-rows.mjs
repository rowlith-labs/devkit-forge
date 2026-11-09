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

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function measure(count) {
  const rows = createRows(count);
  globalThis.gc?.();
  const heapBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  const result = importer.processRows(rows);
  const elapsedMs = performance.now() - start;
  const heapGrowthMb =
    (process.memoryUsage().heapUsed - heapBefore) / (1024 * 1024);

  return {
    elapsedMs,
    heapGrowthMb,
    validCount: result.validCount,
    invalidCount: result.invalidCount,
  };
}

// Warm up the same code path before collecting measurements.
importer.processRows(createRows(2_000));

for (const count of [10_000, 50_000, 100_000]) {
  const samples = Array.from({ length: 3 }, () => measure(count));
  const medianMs = median(samples.map((sample) => sample.elapsedMs));
  const medianHeapGrowthMb = median(
    samples.map((sample) => sample.heapGrowthMb),
  );
  const rowsPerSecond = Math.round(count / (medianMs / 1_000));
  const { validCount, invalidCount } = samples[0];

  console.log(
    count.toLocaleString() + " rows (median of 3): " +
    medianMs.toFixed(1) + " ms; " +
    rowsPerSecond.toLocaleString() + " rows/sec; " +
    validCount.toLocaleString() + " valid; " +
    invalidCount.toLocaleString() + " invalid; " +
    medianHeapGrowthMb.toFixed(1) + " MiB approximate heap growth",
  );
}
