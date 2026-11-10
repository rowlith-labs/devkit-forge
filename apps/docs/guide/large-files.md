# Working with large files

The ordinary `parseCsvFile` helper reads the entire file as text and returns all parsed records. It rejects files larger than 25 MiB by default; set `maxFileSizeBytes` to an appropriate positive safe integer to change that limit. The React hook also stores all source rows and the latest result in React state. These are convenient APIs, but they are not intended for very large files.

## Stream CSV in batches

Use `streamCsvFile` to parse a browser `File` in chunks and receive row batches:

```ts
import { streamCsvFile } from "@rowlith/import-csv";

const summary = await streamCsvFile(file, {
  chunkSize: 1024 * 1024,
  onRows(rows, rowOffset) {
    // Process or persist this batch before returning.
    console.log("Batch begins at source row", rowOffset, rows.length);
  },
});

console.log(summary.rowCount, summary.issues);
```

The callback is synchronous by design. `rowOffset` and issue `rowIndex` values are zero-based data-row indexes; the header row is excluded. If the callback throws, parsing is aborted and the promise rejects. `chunkSize` and `maxIssues` must be positive safe integers. Streaming retains at most 1,000 diagnostics by default. Additional issues are summarized with `issues-truncated`; `totalIssueCount` still reports the full number encountered. Set `maxIssues` to change the cap.

## Keep memory bounded

Streaming only helps if the consumer does not collect every batch into another large array. Process, validate, or persist each batch before returning from the callback.

The current streaming API emits arrays of cell strings and header metadata. It does not automatically run the core schema engine for you; compose the layers in your callback.

## Limitations

- File-based APIs require the browser `File` API.
- Streaming callback work must be synchronous.
- A streaming import is not automatically transactional; your application must decide how to handle partial progress and failures.
- The React hook is intended for ordinary in-memory datasets, not huge streaming imports.
