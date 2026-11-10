# Release readiness

All publishable libraries live under `packages/`. Applications under `apps/` are not npm packages.

## Release process

1. Add a reviewed Changeset for every user-facing library change with `pnpm changeset`; choose patch, minor, or major according to the public API impact.
2. Review the pending release plan with `pnpm changeset status --verbose`.
3. When deliberately preparing a release, run `pnpm version-packages` to update package versions, internal dependency ranges, and changelogs. Review every generated diff and commit it to `main`.
4. Confirm the dependency lockfile is committed and reproducible installs pass with `pnpm install --frozen-lockfile`.
5. Confirm CI and CodeQL pass on the exact `main` commit being released. CI includes package typechecks, tests, builds, archive checks, examples, documentation build, dependency audit, and browser tests.
6. Review package archives with `pnpm check:pack`. Confirm each archive includes its entry points, README, and MIT license, and that internal dependency versions have been rewritten correctly.
7. Confirm the npm package scope and trusted publisher configuration are correct.
8. Publish only through the repository's manually dispatched **Publish npm release** GitHub Actions workflow.

## Package archive check

`pnpm check:pack` packs each library and checks that:

- The archive contains the declared runtime and TypeScript entry points, package README, and MIT license.
- The package name, semantic version, public access, Node engine, repository, homepage, and issue metadata are present.
- The package license matches the repository license.
- Internal `workspace:` dependency protocols have been rewritten to the matching workspace package versions.

This catches a common monorepo release failure: a package that builds inside the workspace but cannot be installed by an external consumer.

## Publishing policy

Publishing is deliberately manual. A push, merge, or Changeset does not publish packages. The **Publish npm release** workflow is dispatched explicitly from `main` and requires the confirmation input `PUBLISH`.

The workflow uses npm Trusted Publishing (GitHub Actions OIDC), not a long-lived npm access token. It pins npm CLI 11.5.1, uses Node.js 24, requests the GitHub OIDC identity token, and publishes packages in dependency order:

1. `@devkit-forge/import-core`
2. `@devkit-forge/import-csv`
3. `@devkit-forge/import-xlsx`
4. `@devkit-forge/import-react`
5. `@devkit-forge/import-ui`

Already-published package versions are skipped. Registry lookup errors other than a confirmed missing package stop the workflow rather than being treated as permission to publish.

Each npm package must have a trusted publisher configured for GitHub Actions with owner `yourdevujjawal`, repository `devkit-forge`, and workflow filename `publish-release.yml`. Do not add registry tokens to repository secrets or workflow configuration.

## First published versions

The initial public release was published successfully:

| Package | Version |
|---|---:|
| `@devkit-forge/import-core` | `0.1.1` |
| `@devkit-forge/import-csv` | `0.2.0` |
| `@devkit-forge/import-xlsx` | `0.1.1` |
| `@devkit-forge/import-react` | `0.1.1` |
| `@devkit-forge/import-ui` | `0.1.1` |

A successful workflow run confirms what the workflow published; verify package pages and install behavior independently when validating a consumer-facing release.

## Security

Never commit registry credentials. Keep npm Trusted Publishing enabled and review GitHub Actions permissions whenever changing the publishing workflow. Dependency audits and CodeQL complement, but do not replace, code review and release verification.
