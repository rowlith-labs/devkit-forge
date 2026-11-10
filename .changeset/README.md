# Changesets

Every user-visible change to one or more publishable packages should include a changeset file. Create one from the repository root:

```sh
pnpm changeset
```

Select the affected `@rowlith/*` packages and choose the smallest correct SemVer bump:

- **patch**: backwards-compatible bug fix or internal correction
- **minor**: backwards-compatible public API or feature addition
- **major**: breaking public API or behaviour change

Write a concise, user-facing summary. Do not add changesets for documentation-only, playground-only, example-only, or internal CI changes that do not affect published packages.

## Versioning is not publishing

Review pending changesets with:

```sh
pnpm changeset status --verbose
```

When intentionally preparing a release, create package versions and changelogs:

```sh
pnpm version-packages
```

Review every changed package manifest, changelog, and internal dependency range. Run the complete CI suite and package archive checks before merging the version commit.

**Do not run `pnpm changeset publish` as part of normal development or CI.** npm publishing is a separate, explicit final release action after package ownership, registry scope, credentials, provenance, legal and security checks have been completed.
