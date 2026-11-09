# CSV imports

The CSV adapter exposes three entry points.

## Parse text

```ts
import { parseCsvText } from "@devkit-forge/import-csv";

const parsed = parseCsvText("Name;Email\nAda;ada@example.com", {
  delimiter: ";",
});

console.log(parsed.headers);
console.log(parsed.records);
console.log(parsed.issues);
```

If the delimiter is omitted, Papa Parse attempts delimiter detection. Cell values remain strings; implicit number and date conversion is disabled.

## Parse a browser File

```ts
import { parseCsvFile } from "@devkit-forge/import-csv";

const parsed = await parseCsvFile(file);
```

This convenience API reads the complete file into memory before parsing. Use it for small and medium files where that memory cost is acceptable.

## Header diagnostics

The parser preserves header order and reports duplicate or empty headers. It returns `records: null` when headers are not all non-empty and unique, because converting those rows to objects would risk losing source values.

The source `data` array remains available in that case, with each row represented as an array of cell strings.

## Options

```ts
parseCsvText(csvText, {
  delimiter: ";",        // optional explicit delimiter
  skipEmptyLines: true,  // defaults to "greedy"
  trimHeaders: true,     // defaults to true
});
```

Quoted delimiters, escaped quotes, and quoted newlines are supported by the underlying parser.

## Important distinction

CSV parser issues are not the same as core validation issues. A file can parse successfully and still contain rows that fail your destination schema. Check both layers before accepting an import.
