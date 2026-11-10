# Rowlith

[![CI](https://github.com/rowlith-labs/rowlith/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rowlith-labs/rowlith/actions/workflows/ci.yml) [![CodeQL](https://github.com/rowlith-labs/rowlith/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/rowlith-labs/rowlith/actions/workflows/codeql.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Open-source developer tools built to remove repetitive engineering work.

> **Status:** Public preview (0.1.x). APIs may change before 1.0.0; review the package guides before adopting in production.

## Data Import Toolkit

A TypeScript-first, framework-agnostic data-import toolkit with optional CSV, XLSX, React, and Web Component adapters. It provides column mapping, transforms, validation, duplicate detection, streaming CSV batches, and structured diagnostics.

## Repository structure

```
apps/
  docs/             # VitePress documentation site
  playground/
packages/
  import-core/      # framework-independent schema mapping and validation
  import-csv/       # CSV parsing and streaming adapter
  import-xlsx/      # XLSX workbook adapter
  import-react/     # headless React adapter
  import-ui/        # optional framework-independent Web Component
examples/
  vite-react/       # runnable React integration example
  vanilla-ui/       # runnable Web Component integration example
```

## Principles

- Core logic is framework-agnostic.
- No file uploads to a hosted service; processing is local to the consuming application.
- Small, typed APIs with predictable results.
- Useful open-source functionality under the MIT License.
- Optional adapters rather than mandatory framework or validation-library dependencies.

## Development

Requirements: Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm check:pack
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

## Runnable example

A working Vite + React example composes the CSV parser, core schema validation, and React hook. Run it from the repository root:

```bash
pnpm install
pnpm --filter @rowlith/example-vite-react dev
# In another terminal, or instead:
pnpm --filter @rowlith/example-vanilla-ui dev
```

See [the React example README](./examples/vite-react/README.md) and [the Web Component example README](./examples/vanilla-ui/README.md) for details.

## Module format

The publishable packages currently ship ECMAScript modules (ESM) and TypeScript declarations. They do not provide a CommonJS `require()` build. Use an ESM-capable Node.js or browser bundler toolchain.

## Current scope

The current packages are `@rowlith/import-core`, `@rowlith/import-csv`, `@rowlith/import-xlsx`, `@rowlith/import-react`, and the optional `@rowlith/import-ui` Web Component. The React adapter remains headless; the browser playground and VitePress documentation site are separate applications. The XLSX adapter is an in-memory parser with explicit file-size, archive-expansion, workbook-structure, and row limits; it is separate from the core package. Both examples are runnable workspace apps. The React and Web Component examples use in-memory parsing for ordinary-sized files; use the CSV streaming API directly for large files.

## Package releases

The npm libraries are maintained under `packages/`. Run `pnpm check:pack` to verify that each built package produces an installable archive with publishable internal dependency versions. See the [release readiness guide](./apps/docs/guide/release-readiness.md) before publishing. npm publishing is a deliberate manual GitHub Actions workflow using npm Trusted Publishing (OIDC); pushes and merges never publish automatically.

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development and contribution guidance, [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community standards, and [SECURITY.md](./SECURITY.md) for responsible vulnerability reporting. Dependabot checks dependencies weekly, and CodeQL performs scheduled JavaScript/TypeScript analysis.

## Licence

MIT. See [LICENSE](./LICENSE).
