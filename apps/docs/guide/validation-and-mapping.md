# Validation and mapping

The core importer maps plain source records to a typed destination schema.

## Define columns

Each configured column has a destination `key` and source-facing `label`. Optional settings include:

- `required`: reject missing, null, or whitespace-only string values.
- `transform`: convert a source value before required checks and validation.
- `validate`: return an error message when the mapped value is invalid.

Transforms and validators receive the source row or partially mapped destination row, respectively. Exceptions thrown by either are caught and represented as row-level invalid issues.

## Automatic mapping

When the second argument to `processRows` is omitted, source headers are normalized and compared with configured column labels and keys.

```ts
const result = importer.processRows([
  { "Full Name": "Ada Lovelace", Email: "ada@example.com" },
]);
```

Header normalization ignores differences such as case, spaces, and punctuation.

## Explicit mapping

When a mapping object is supplied, it is authoritative. The engine does not guess mappings for omitted source headers. This allows an application to let users choose exactly which source column populates each destination field.

```ts
const result = importer.processRows(rows, {
  "Customer name": "name",
  "Contact email": "email",
});
```

An explicitly supplied empty object is different from omitting the mapping: it means no source columns have been mapped.

If more than one source header maps to a destination column, the row receives an `ambiguous` issue. Unmapped required columns can produce required-field issues; source headers not selected for any configured destination are not automatically imported.

## Duplicate detection

Configure `duplicateKeys` with destination keys. Values are converted to strings, trimmed, and compared case-insensitively. The first non-empty occurrence reserves the value; later occurrences are reported as duplicates.

A row can have more than one issue. A row is valid only when it has no issues.

## Result shape

```ts
interface ProcessRowsResult<T> {
  validRows: T[];
  invalidRows: Array<{
    rowIndex: number; // zero-based source array index
    row: Partial<T>;
    issues: ImportIssue[];
  }>;
  totalRows: number;
  validCount: number;
  invalidCount: number;
}
```

Issue codes currently include `required`, `invalid`, `duplicate`, and `ambiguous`. The exported issue-code type also reserves `unmapped` for future use.
