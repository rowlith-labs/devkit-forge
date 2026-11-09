# @devkit-forge/import-csv

CSV parsing adapter for the DevKit Forge import engine.

## Install

```bash
npm install @devkit-forge/import-csv @devkit-forge/import-core
```

## Functions

### `parseCsvText(input, options?)`

Parses CSV text and returns headers, source arrays, object records (when headers are safe), parser issues, detected delimiter, row count, and an error flag.

### `parseCsvFile(file, options?)`

Reads a browser `File` into memory and parses its text. Prefer this for small and medium files.

### `streamCsvFile(file, options)`

Parses a browser `File` in chunks. Requires an `onRows(rows, rowOffset)` callback. The callback is synchronous; throwing aborts parsing and rejects the promise.

## Types

- `CsvParseOptions`: optional delimiter, empty-line behavior, and header trimming.
- `CsvParseResult`: headers, cell arrays, records, issues, delimiter, row count, and error flag.
- `CsvStreamOptions`: parse options, chunk size, and row callback.
- `CsvStreamResult`: headers, issues, delimiter, row count, and error flag.
- `CsvIssue`: parser/header/row-width issue code and message, with optional row and column indexes.

## Important behavior

- Cell values remain strings; implicit type conversion is disabled.
- Header order is preserved.
- Duplicate and empty headers are reported.
- `records` is null when headers are not all non-empty and unique.
- Blank lines are skipped by default.
- Quoted delimiters and embedded newlines are supported.

See [CSV imports](/guide/csv-imports), [XLSX imports](/guide/xlsx-imports), and [large files](/guide/large-files).
