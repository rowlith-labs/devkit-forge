# Contributing to DevKit Forge

Thanks for considering a contribution. The project is an early-stage TypeScript monorepo; small, focused changes with tests and documentation are easiest to review.

## Before you start

- Check existing issues and discussions before starting substantial work.
- For a significant API or architecture change, open an issue first so the intended behaviour can be agreed before implementation.
- Do not include real customer data, credentials, access tokens, private files, or security-sensitive details in issues, tests, or pull requests.
- Keep framework-specific code out of `import-core`. Prefer optional adapters.

## Development setup

Requirements: Node.js 20 or newer and pnpm 9 or newer.

```sh
git clone https://github.com/yourdevujjawal/devkit-forge.git
cd devkit-forge
pnpm install
```

## Useful checks

Run the relevant package checks while iterating, then run the full suite before submitting:

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm check:pack
pnpm --filter @devkit-forge/example-vite-react build
pnpm --filter @devkit-forge/docs build
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

The CI workflow is the source of truth for required checks. Benchmarks are comparative signals, not fixed performance guarantees.

## Pull request expectations

- Keep changes focused and explain the user-visible problem.
- Add or update tests for changed behaviour, including regression tests for bugs.
- Update package READMEs and the VitePress guide when public APIs or behaviour change.
- Keep examples compiling against the actual workspace packages.
- Document breaking changes, security trade-offs, resource limits, and browser limitations.
- Do not publish packages, create releases, or add registry credentials as part of an ordinary contribution.
- Avoid unrelated formatting churn.

## API design principles

- Keep core framework-independent and typed.
- Make defaults predictable and document them.
- Prefer explicit resource limits for untrusted file formats.
- Preserve diagnostics rather than silently dropping malformed input.
- Never evaluate formulas or imported content as code.
- Do not add telemetry or upload imported data without explicit, documented user consent.
