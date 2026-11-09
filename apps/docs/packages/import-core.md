# @devkit-forge/import-core

Framework-independent schema mapping and row validation.

## Install

```bash
npm install @devkit-forge/import-core
```

## API

### `createImporter<T>(config)`

Creates an importer for destination type `T`.

```ts
import { createImporter } from "@devkit-forge/import-core";
import type { ImportConfig } from "@devkit-forge/import-core";

interface User {
  email: string;
  name: string;
}

const config: ImportConfig<User> = {
  columns: [
    { key: "email", label: "Email", required: true },
    { key: "name", label: "Full name", required: true },
  ],
  duplicateKeys: ["email"],
};

const importer = createImporter<User>(config);
const result = importer.processRows([
  { Email: "ada@example.com", "Full name": "Ada" },
]);
```

### `importer.processRows(sourceRows, mapping?)`

Processes an array of plain records and returns `ProcessRowsResult<T>`. Omit `mapping` for automatic header matching. Supply a `ColumnMapping<T>` to make mapping explicit.

### `normalizeHeader(value)`

Normalizes a header for matching by ignoring case, spaces, and punctuation.

## Types

- `RawImportRow`: `Record<string, unknown>`
- `ImportColumn<T>`: destination key, label, optional required flag, transform, and validator
- `ImportConfig<T>`: configured columns and optional duplicate keys
- `ColumnMapping<T>`: source header to destination key map
- `ImportIssue`: zero-based row index, destination column, value, issue code, and message
- `ProcessRowsResult<T>`: valid and invalid rows with summary counts

## Issue codes

`required`, `invalid`, `duplicate`, `unmapped`, and `ambiguous`.

See [Validation and mapping](/guide/validation-and-mapping) for mapping semantics and duplicate behavior.
