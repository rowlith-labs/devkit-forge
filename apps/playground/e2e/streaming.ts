import { streamCsvFile } from "@rowlith/import-csv";

const status = document.querySelector<HTMLOutputElement>("#status");
const rowTotal = 25_000;
const csv = [
  "name,age",
  ...Array.from({ length: rowTotal }, (_, index) => "Person " + index),
].join("\n");
const file = new File([csv], "large-stream-test.csv", { type: "text/csv" });

let processedRows = 0;
let offsetMismatch = false;

try {
  const result = await streamCsvFile(file, {
    chunkSize: 8 * 1024,
    maxIssues: 25,
    onRows(rows, rowOffset) {
      if (rowOffset !== processedRows) offsetMismatch = true;
      processedRows += rows.length;
    },
  });

  if (status) {
    status.dataset.complete = "true";
    status.textContent = JSON.stringify({
      processedRows,
      rowCount: result.rowCount,
      totalIssueCount: result.totalIssueCount,
      retainedIssueCount: result.issues.length,
      issuesTruncated: result.issuesTruncated,
      offsetMismatch,
    });
  }
} catch (error) {
  if (status) {
    status.dataset.complete = "true";
    status.dataset.error = "true";
    status.textContent = error instanceof Error ? error.message : String(error);
  }
}
