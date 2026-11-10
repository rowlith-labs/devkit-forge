# Release readiness

All publishable libraries live under `packages/`. Applications under `apps/` are not npm packages.

## Before the first public release

1. Confirm the `@devkit-forge` npm organization/scope is controlled by the project owner and the package names are available.
2. Review the package APIs, dependency licenses, security posture, and ownership/IP rights.
3. Update versions deliberately. The packages currently share an early-development version; do not treat that as a stable release.
4. Confirm the dependency lockfile is committed and reproducible installs pass with `pnpm install --frozen-lockfile`.
5. Run the complete CI workflow, including both integration examples, browser tests, CodeQL, and `pnpm check:pack`.
6. Review each generated archive with `pnpm --dir packages/<package> pack --pack-destination <directory>` before publishing.
7. Verify each package archive contains its own MIT license and that internal dependency versions match the packages being released.
8. Publish packages in dependency order: `import-core`, then `import-csv` / `import-xlsx`, then `import-react` / `import-ui`.

## Package archive check

`pnpm check:pack` packs each library and checks that:

- The archive contains the declared runtime and TypeScript entry points, package README, and MIT license.
- The package name, semantic version, public access, Node engine, repository, homepage, and issue metadata are present.
- The package license matches the repository license.
- Internal `workspace:` dependency protocols have been rewritten to the matching workspace package versions.

This catches a common monorepo release failure: a package that builds inside the workspace but cannot be installed by an external consumer.

## Publishing policy

Dependabot proposes dependency updates and CodeQL scans JavaScript/TypeScript code, but neither replaces a manual release review. There is intentionally no automatic npm publish on push or tag yet. The repository needs a verified npm scope, a deliberate versioning/release process, and owner-controlled publishing credentials before a release workflow is enabled. CI archive checks are not evidence that a package has been published or that its name is available.

For the first release, publish from a trusted environment with an npm account that has publish access to the scope. Prefer npm trusted publishing with provenance when the repository and npm scope have been configured for it. Never commit registry tokens.
