# @devkit-forge/import-xlsx

XLSX workbook parsing adapter for DevKit Forge.

## Install

```bash
npm install @devkit-forge/import-xlsx @devkit-forge/import-core
```

## API

### `parseXlsxFile(input, options?)`

Reads a browser `Blob`/`File`, `ArrayBuffer`, or `Uint8Array` and returns worksheet names, the selected sheet, headers, source cell arrays, object records (when headers are safe), issues, and row counts.

### Options

- `sheet`: worksheet name or zero-based worksheet index; defaults to the first sheet.
- `headerRow`: one-based header row; defaults to 1.
- `trimHeaders`: defaults to true.
- `emptyRows`: `skip` or `preserve`; defaults to skip.
- `formulaPolicy`: `cached-value`, `formula-text`, or `reject`; defaults to cached-value.
- `maxFileSizeBytes`: defaults to 25 MiB.
- `maxRows`: defaults to 100,000.
- `maxIssues`: defaults to 1,000.
- `maxEntryUncompressedSize`: defaults to 16 MiB.
- `maxTotalUncompressedSize`: defaults to 64 MiB.
- `maxMergeCells`, `maxDataValidationCells`, `maxDefinedNameCells`: default to 100,000 each.

All numeric limits must be positive safe integers. The implementation depends on the unofficial security-maintained `exceljs-hardened` fork and configures its ZIP expansion and workbook-range guards explicitly.

## Types

- `XlsxParseOptions`
- `XlsxParseResult`
- `XlsxIssue` and `XlsxIssueCode` (including `formula-no-cache` when a formula has no saved result)
- `XlsxFormulaPolicy`
- `XlsxEmptyRowPolicy`
- `XlsxSheetSelector`

See [XLSX imports](/guide/xlsx-imports) for formula handling, cell types, diagnostics, and resource limits.
