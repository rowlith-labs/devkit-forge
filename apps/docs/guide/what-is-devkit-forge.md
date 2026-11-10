# What is DevKit Forge?

DevKit Forge is an open-source TypeScript toolkit for the part of an application that turns uploaded tabular data into records your software can safely work with.

Imagine adding a CSV or Excel upload feature to a CRM. The file may have unfamiliar column names, missing required values, duplicate customers, or malformed rows. Your application needs to read the file, map its columns to your data model, validate the records, and tell the user what needs fixing.

Those steps are common across products, but developers often rebuild them for every import screen. DevKit Forge provides reusable building blocks for that import-processing work.

## The problem it is designed to solve

A file upload control is only the beginning. A useful import workflow also needs to answer:

- Which source column maps to each field in my application?
- What happens when a required value is missing?
- How do I detect duplicate identifiers in one upload?
- Can I show the user exactly which row failed and why?
- Can I process large CSV files without holding the entire file in memory?

DevKit Forge provides APIs for parsing supported file formats, mapping source data, validating records, detecting duplicates, and reporting structured issues.

## How it fits into your application

1. Your application receives a file or already-parsed records.
2. A file adapter reads CSV or XLSX input when needed.
3. The core importer maps source columns and validates each row against the schema you define.
4. Your UI displays valid rows and actionable errors.
5. Your application decides whether and how to save accepted records.

DevKit Forge does not upload files to a DevKit Forge server, authenticate users, call your backend, or persist records. Those responsibilities stay with your application.

## Package responsibilities

| Package | What it does |
| --- | --- |
| \`@devkit-forge/import-core\` | Framework-independent mapping, transforms, validation, duplicate detection, and structured row results |
| \`@devkit-forge/import-csv\` | CSV text and browser File parsing, diagnostics, and batch streaming |
| \`@devkit-forge/import-xlsx\` | XLSX workbook and worksheet parsing with explicit safety limits |
| \`@devkit-forge/import-react\` | Headless React hook for import rows, mappings, and results |
| \`@devkit-forge/import-ui\` | Optional framework-independent browser Web Component |

You do not have to install every package. Combine only the pieces your application needs.

## When it is a good fit

- SaaS products with admin bulk-import screens.
- CRM, inventory, catalogue, or contact imports.
- File-based migration from a legacy system.
- Internal finance, HR, support, or operations portals.
- Applications that need consistent import validation across multiple screens.

Read [practical use cases](/guide/use-cases) for scenarios, package combinations, and limitations.

## When it is not the right tool

DevKit Forge is not a full ETL platform, scheduled integration service, hosted upload product, database migration framework, or complete spreadsheet editor. It provides import-processing primitives; it does not replace your application's business workflow.

## Try it

Start with the [quick start](/guide/quick-start), or explore the [runnable examples](/guide/examples) to see the packages composed in an application.
