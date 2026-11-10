# @devkit-forge/import-csv

CSV parsing adapter for the DevKit Forge import engine. It is separate from `@devkit-forge/import-core`, so core-only users do not inherit a CSV parser.

## Install

```sh
pnpm add @devkit-forge/import-csv @devkit-forge/import-core
```

## Parse CSV text

```ts
import { parseCsvText } from "@devkit-forge/import-csv";

const result = parseCsvText(`Name,Email
Ada,ada@example.com`);

if (result.records === null || result.hasErrors) {
  console.error(result.issues);
} else {
  console.log(result.records);
}
```

## Parse a browser File

For small and medium files, `parseCsvFile` is the convenient API. It reads the full file into memory and rejects files larger than 25 MiB by default. Override `maxFileSizeBytes` when a different in-memory limit is appropriate; use `streamCsvFile` for large files.

```ts
import { parseCsvFile } from "@devkit-forge/import-csv";

const result = await parseCsvFile(file, {
  maxFileSizeBytes: 25 * 1024 * 1024, // default: 25 MiB
});
console.log(result.headers, result.records, result.issues);
```

## Stream large files

For large files, use `streamCsvFile`. It parses in chunks and sends each batch to `onRows`; it does not accumulate the rows in memory.

```ts
import { streamCsvFile } from "@devkit-forge/import-csv";

const summary = await streamCsvFile(file, {
  chunkSize: 1024 * 1024, // 1 MiB input chunks; default
  onRows(rows, rowOffset) {
    // Process or persist this batch before returning.
    console.log("Batch starts at row", rowOffset, rows);
  },
});

console.log(summary.headers, summary.rowCount, summary.issues);
```

The callback is synchronous by design. `rowOffset` and issue `rowIndex` values are zero-based data-row indexes (the header is excluded). If processing fails, throw from the callback; parsing is aborted and the returned promise rejects. `chunkSize` and `maxIssues` must be positive safe integers. Streaming retains at most 1,000 diagnostics by default; excess diagnostics are summarized with an `issues-truncated` issue while `totalIssueCount` preserves the full count. Set `maxIssues` to tune this cap. Do not retain batches if the goal is to keep memory usage low. The browser File API is required for file-based APIs.

## Result and safety behavior

- Header order is preserved.
- Duplicate and empty headers are reported.
- Rows remain arrays in streaming mode, so duplicate header names cannot overwrite cells.
- Row-width mismatches and Papa Parse errors are reported.
- Cell values remain strings; no implicit number/date conversion occurs.
- Empty lines are skipped by default; quoted delimiters and quoted newlines are supported.

`parseCsvText` and `parseCsvFile` return object `records` only when all headers are non-empty and unique. Otherwise `records` is `null`, while source array data remains available.

## Options

```ts
parseCsvText(csvText, {
  delimiter: ";",       // optional; otherwise auto-detected
  skipEmptyLines: true, // defaults to "greedy"
  trimHeaders: true,    // defaults to true
});
```

Spreadsheet formats, resumable uploads, and React UI are separate follow-up work.
