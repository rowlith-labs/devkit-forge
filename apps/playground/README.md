# Import Playground

A local-first browser playground for the Rowlith CSV importer.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter @rowlith/playground dev
```

Then open the local Vite URL printed in the terminal.

## What it demonstrates

- CSV parsing through `@rowlith/import-csv`
- Schema-driven mapping and validation through `@rowlith/import-core`
- React state management through `@rowlith/import-react`
- Automatic header matching with optional manual mapping
- Required-field, email-format, and duplicate detection
- Valid-row CSV export and row-level error report export

Files are parsed and processed in the browser. No CSV data is sent to a server. The demo intentionally limits uploads to 10 MiB because it uses the in-memory parsing and React state APIs; use `streamCsvFile` for larger files.

## Browser smoke tests

From the repository root, install the Playwright browser engines and run the end-to-end suite:

```sh
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

The CI workflow runs these checks in Chromium, Firefox, and WebKit.
