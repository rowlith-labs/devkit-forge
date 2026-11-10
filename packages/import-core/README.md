# @rowlith/import-core

Framework-agnostic row mapping and validation for data-import workflows.

## Current API

```ts
import { createImporter } from "@rowlith/import-core";

interface Customer {
  email: string;
  name: string;
}

const importer = createImporter<Customer>({
  columns: [
    {
      key: "email",
      label: "Email",
      required: true,
      validate: (value) =>
        typeof value === "string" && value.includes("@")
          ? undefined
          : "Enter a valid email address.",
    },
    { key: "name", label: "Full Name", required: true },
  ],
  duplicateKeys: ["email"],
});

const result = importer.processRows([
  { Email: "ada@example.com", "Full Name": "Ada Lovelace" },
]);
```

## Mapping rules

- If no mapping is passed, source headers are matched against normalized column labels or keys.
- If a mapping is passed, it is authoritative. Unmapped source headers are not guessed.
- If multiple source headers match one destination column automatically, the row receives an `ambiguous` issue.
- Row indexes in results are zero-based.

## Validation rules

- Required values include non-empty strings; whitespace-only strings are missing.
- Custom transforms run before required checks and validation.
- Transform and validator exceptions are caught and reported as row-level `invalid` issues.
- Duplicate values are compared after string conversion, trimming, and lowercasing.
- The first non-empty duplicate-key value reserves that value, even if its row has another validation issue. Later occurrences are reported as duplicates.

## Scope

This package intentionally focuses on schema mapping, transforms, validation, duplicate detection, and structured row results. File parsing is provided by `@rowlith/import-csv` and `@rowlith/import-xlsx`; React state integration is provided by `@rowlith/import-react`; the optional browser UI is provided by `@rowlith/import-ui`. Streaming CSV parsing is available in the CSV adapter. Persistence and final import execution remain the responsibility of the consuming application.

## Performance benchmark

Run the reproducible local benchmark against 10k, 50k, and 100k rows:

```sh
pnpm --filter @rowlith/import-core benchmark
```

The benchmark reports the median elapsed time, throughput, and approximate heap growth across three samples on the current machine. The heap figure is neither retained memory nor peak memory usage; it is a rough allocation signal. CI runs the same benchmark to keep a visible baseline in its logs. Treat all measurements as comparative signals, not cross-machine performance guarantees; compare runs under similar Node.js versions and hardware.
