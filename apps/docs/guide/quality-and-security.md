# Quality, security, and accessibility

Stage 6 hardens the import pipeline and documents the boundaries consumers must account for.

## Automated checks

The main-branch CI workflow runs:

- TypeScript type-checking, unit tests, and package builds for core, CSV, and React
- CSV streaming regression tests for quoted records crossing chunk boundaries, final partial chunks, parser and row-width diagnostics, row offsets, callback failures, and invalid options
- A core processing benchmark at 10k, 50k, and 100k rows
- Playground type-checking, tests, and production build
- Documentation production build

The benchmark reports the median of three samples after warm-up. Its heap-growth figure is an approximate before/after heap delta, not peak or retained memory. Treat throughput as environment-specific; compare only on the same runtime and hardware.

## Large-file behavior

Use `parseCsvText` or `parseCsvFile` for ordinary in-memory imports. They materialize the complete input and parsed records.

Use `streamCsvFile` for large browser files. It emits synchronous row batches and does not retain all parsed rows. The default parser chunk is 1 MiB. The default retained diagnostic limit is 1,000; when more are encountered, the returned issue list includes `issues-truncated`, while `totalIssueCount` reports the complete count. Consumers should process each batch before returning and avoid collecting every batch in their own memory.

Streaming is not a transactional import. If a callback fails, earlier batches may already have been processed; consumers must define their own rollback or staging strategy.

The interactive playground deliberately caps uploads at 10 MiB because it uses the in-memory parser and React state. This is a demo safeguard, not a limit of `streamCsvFile`.

## Security considerations

- Treat CSV files and every cell as untrusted input.
- The parser keeps values as strings; it does not evaluate formulas or coerce values into JavaScript expressions.
- The playground serializes exported CSV with quoting and neutralizes common spreadsheet formula prefixes (`=`, `+`, `-`, and `@`) by prefixing an apostrophe.
- Formula neutralization is an export policy, not a guarantee for every spreadsheet application or every downstream workflow. Applications exporting user-controlled data should apply and test their own policy.
- Do not render imported values as raw HTML. Use framework text rendering or context-appropriate output encoding.
- Avoid logging sensitive imported records. The playground processes files locally and does not send CSV contents to a server.

## Accessibility

The playground provides labelled mapping selects, a labelled row-filter group, a keyboard-focusable file picker, visible focus styling for that picker, and semantic table markup. Drag-and-drop is an enhancement; the browse control remains available without a pointer.

## Browser verification

CI runs the same browser smoke tests in Chromium, Firefox, and WebKit (the browser engine used by Safari) for sample import and validation, keyboard focus of the file picker, formula-safe CSV export, and the playground's 10 MiB upload guard. Before a production deployment, manually smoke-test current Safari on macOS/iOS and drag-and-drop plus narrow viewport layout. Profile representative large files in target browsers: memory use depends on browser, file shape, callback work, and whether the consumer retains batches.
