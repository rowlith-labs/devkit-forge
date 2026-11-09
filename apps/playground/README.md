# Import Playground

A local-first browser playground for the DevKit Forge CSV importer.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter @devkit-forge/playground dev
```

Then open the local Vite URL printed in the terminal.

## What it demonstrates

- CSV parsing through `@devkit-forge/import-csv`
- Schema-driven mapping and validation through `@devkit-forge/import-core`
- React state management through `@devkit-forge/import-react`
- Automatic header matching with optional manual mapping
- Required-field, email-format, and duplicate detection
- Valid-row CSV export and row-level error report export

Files are parsed and processed in the browser. No CSV data is sent to a server.
