# Installation

Install only the packages your application needs. The package manager will resolve the required dependencies.

## Core only

```bash
npm install @devkit-forge/import-core
```

## CSV parsing

```bash
npm install @devkit-forge/import-csv @devkit-forge/import-core
```

## XLSX parsing\n\n```bash\nnpm install @devkit-forge/import-xlsx @devkit-forge/import-core\n```\n\n## React integration

```bash
npm install @devkit-forge/import-react @devkit-forge/import-core react
```

The React adapter declares React 18 and React 19 as peer dependency versions.

## Package manager notes

Examples use npm, but pnpm and yarn can also be used. The repository itself uses pnpm workspaces.

## Requirements

- TypeScript projects should use a modern TypeScript version with ES module and bundler resolution.
- File-based CSV helpers require the browser `File` API.\n- The XLSX adapter uses ExcelJS and loads each workbook in memory; its default limits are 25 MiB and 100,000 rows.
- The core package has no framework dependency.
- The CSV package uses Papa Parse; the React package uses React as a peer dependency.
