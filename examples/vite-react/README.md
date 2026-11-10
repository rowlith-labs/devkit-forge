# Vite + React CSV import example

A runnable, browser-only example that composes:

- `@rowlith/import-csv` to parse a selected CSV file.
- `@rowlith/import-core` to map headers, validate required fields, and detect duplicate email addresses.
- `@rowlith/import-react` to hold rows and validation results in React.

## Run locally

From the repository root:

```sh
pnpm install
pnpm --filter @rowlith/example-vite-react dev
```

Open the local URL printed by Vite. Use **Load sample data** to see valid and invalid rows, or choose your own CSV with columns matching `Full Name`, `Email`, and `Company`.

## Build

```sh
pnpm --filter @rowlith/example-vite-react typecheck
pnpm --filter @rowlith/example-vite-react build
```

The example is intentionally small and does not send data to a backend. It uses the in-memory CSV parser and React hook, so it is for ordinary-sized files. For large CSV files, use `streamCsvFile` and process each batch without retaining the whole file in React state.

This example is part of the monorepo and is not a separately published npm package.
