# What is DevKit Forge?

DevKit Forge is an open-source collection of TypeScript tools for building data-import workflows. Its first project focuses on bringing external tabular data into application-specific record shapes with predictable mapping and validation results.

The project is designed as independent layers rather than one all-inclusive import UI.

## Design principles

- **Framework-independent core:** the schema and validation engine works with plain records.
- **Optional adapters:** CSV parsing and React state management are separate packages.
- **Explicit behavior:** automatic header matching is available, while an explicitly supplied mapping is authoritative.
- **Useful diagnostics:** invalid records include row indexes and structured issues.
- **Local-first:** parsing and validation run in the consuming application. No hosted upload service is required.
- **Application-owned persistence:** the library does not silently submit or store imported data.

## Current packages

| Package | Responsibility |
| --- | --- |
| `@devkit-forge/import-core` | Mapping, schema transforms, validation, duplicate detection |
| `@devkit-forge/import-csv` | CSV text and browser File parsing, streaming |
| `@devkit-forge/import-react` | Headless React state adapter |

The packages are in early development and use a `0.1.0` version. APIs may change before a stable release.

## What it is not

DevKit Forge is not currently a hosted ETL platform, a database, a background job service, or a prebuilt design system. It gives your application composable primitives for implementing its own import experience.
