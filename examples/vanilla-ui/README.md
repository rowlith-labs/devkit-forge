# Vanilla Web Component import example

A small Vite app demonstrating `@rowlith/import-ui` without React or another UI framework. The component composes the core, CSV, and XLSX packages, and emits typed load, validation, and error events.

## Run locally

From the repository root:

```sh
pnpm install
pnpm --filter @rowlith/example-vanilla-ui dev
```

Choose a `.csv` or `.xlsx` file, review the detected columns, configure mappings in the component, and run validation. The report panel displays the component's public events.

## Build

```sh
pnpm --filter @rowlith/example-vanilla-ui typecheck
pnpm --filter @rowlith/example-vanilla-ui build
```

The app processes files locally and does not upload or persist records. It uses in-memory parsing and is not intended for very large files. For large CSVs, use `streamCsvFile` directly. This is a workspace example, not a separately published package.
