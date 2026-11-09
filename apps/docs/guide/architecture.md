# Architecture

The import toolkit is split into three layers. Each package has a narrow responsibility and can be used independently where appropriate.

```text
Your application
  ├─ File selection and user experience
  ├─ @devkit-forge/import-react (optional state adapter)
  ├─ @devkit-forge/import-csv (optional parser)
  └─ @devkit-forge/import-core
       ├─ Header matching / explicit mapping
       ├─ Column transforms
       ├─ Required and custom validation
       └─ Duplicate detection and structured results
```

## Core

The core accepts arrays of plain source records. It maps fields to a typed destination schema, applies transforms, validates values, detects duplicates, and returns valid and invalid records.

It does not know about files, browser components, React, network requests, or persistence.

## CSV adapter

The CSV package turns CSV text or browser files into records. It reports parser and header diagnostics separately from core schema issues.

For files too large to hold as one parsed object array, `streamCsvFile` emits row batches to a synchronous callback. The consumer must process each batch and avoid retaining it if bounded memory is the goal.

## React adapter

The React package wraps the core importer in a hook. It stores rows, mappings, and the latest processing result. It does not parse files or render UI.

## Data flow

1. Your UI obtains a file or source data.
2. A parser adapter returns source records and parser diagnostics.
3. Your application resolves parser diagnostics and column mappings.
4. The core engine maps and validates records.
5. Your UI presents the valid and invalid results.
6. Your application decides whether and how to persist valid records.

## Error boundaries

CSV issues describe source-file problems such as duplicate headers, empty headers, malformed parser input, or row-width mismatches. Core issues describe schema mapping and validation problems such as required values, invalid values, duplicate destination keys, unmapped fields, and ambiguous headers.
