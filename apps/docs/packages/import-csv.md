# @rowlith/import-csv

A CSV parsing adapter that turns text or a browser `File` into headers, source rows, diagnostics, and (when safe) object records. It is separate from `@rowlith/import-core`, so applications that do not import CSV do not need a CSV parser dependency.

## Install

```bash
npm install @rowlith/import-csv @rowlith/import-core
```

## Parse CSV text

```ts
import { parseCsvText } from "@rowlith/import-csv";

const parsed = parseCsvText(`Name,Email
Ada,ada@example.com`);

if (parsed.records === null || parsed.hasErrors) {
  console.error(parsed.issues);
} else {
  console.log(parsed.records);
}
```

Use `parseCsvText` when the CSV text is already available, such as from an API response or a text editor.

## Parse a browser File

`parseCsvFile(file, options?)` is convenient for small and medium browser uploads. It reads the complete file into memory and enforces a 25 MiB default limit.

```ts
import { parseCsvFile } from "@rowlith/import-csv";

const parsed = await parseCsvFile(file, {
  maxFileSizeBytes: 25 * 1024 * 1024, // default: 25 MiB
});
```

Use this API when the file comfortably fits your application's memory budget. Raising the size limit does not make parsing streaming.

## Stream a large CSV

`streamCsvFile(file, options)` parses a browser `File` in chunks and passes batches to a synchronous callback. It does not accumulate all parsed rows for you.

```ts
import { streamCsvFile } from "@rowlith/import-csv";

const summary = await streamCsvFile(file, {
  chunkSize: 1024 * 1024, // 1 MiB input chunks; default
  onRows(rows, rowOffset) {
    // Consume this batch before returning; do not retain every batch.
    console.log("Batch starts at data row", rowOffset, rows);
  },
});

console.log(summary.headers, summary.rowCount, summary.issues);
```

The callback is synchronous by design. Throwing from it aborts parsing and rejects the promise. `rowOffset` and issue `rowIndex` are zero-based data-row indexes (the header is excluded). `chunkSize` and `maxIssues` must be positive safe integers. Diagnostics are capped at 1,000 by default; excess diagnostics are summarized by an `issues-truncated` issue while `totalIssueCount` preserves the full count. File APIs require the browser `File` API.

## Parsing behavior and edge cases

- Cell values remain strings; there is no implicit number or date conversion.
- Header order is preserved.
- Duplicate and empty headers are reported.
- `records` is `null` unless every header is non-empty and unique. The source cell arrays remain available, so duplicate names cannot overwrite one another.
- Blank lines are skipped by default.
- Quoted delimiters and embedded newlines are supported.
- Row-width mismatches and parser errors are reported as issues.

## Options and result types

- `parseCsvText(input, options?)`: parse a string synchronously.
- `parseCsvFile(file, options?)`: read and parse a browser file in memory.
- `streamCsvFile(file, options)`: process batches from a browser file.
- `CsvParseOptions`: optional delimiter, empty-line behavior, and header trimming.
- `CsvFileParseOptions`: CSV options plus a positive safe-integer `maxFileSizeBytes` (25 MiB by default).
- `CsvStreamOptions`: CSV options, chunk size, diagnostic cap, and required `onRows` callback.
- `CsvParseResult` / `CsvStreamResult`: parsed data or stream summary, issues, delimiter, row count, and error state.
- `CsvIssue`: issue code and message, with optional row and column indexes.

## When to use it

Use this package when CSV is an input format and you need parser diagnostics or chunked file processing. Pass its object records to `@rowlith/import-core` for schema mapping and validation. For React state, add `@rowlith/import-react`; for the ready-made browser interface, use `@rowlith/import-ui`.

Do not use `parseCsvFile` for very large files or expect the streaming callback to perform asynchronous work. The parser does not validate your business schema, upload data, or persist records.

See [CSV imports](/guide/csv-imports), [Large files](/guide/large-files), and [Validation and mapping](/guide/validation-and-mapping).
