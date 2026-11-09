# Troubleshooting

## `records` is null after parsing

The CSV contains an empty or duplicate header. The parser avoids converting these rows to objects because duplicate object keys can overwrite source values. Inspect `parsed.issues` and correct the header row, or use the array-based `data` property to inspect the original cells.

## A column is not mapped automatically

Automatic mapping compares normalized source headers with the configured destination key and label. Check spelling and ensure the source header corresponds to one of those values. For different naming conventions, supply an explicit mapping.

## An empty mapping produces required-field errors

An explicitly supplied mapping is authoritative. An empty object means that no source headers are mapped. Omit the mapping argument to enable automatic matching.

## Why are numbers and dates strings?

The CSV parser disables implicit type conversion. This avoids guessing whether values such as leading-zero identifiers, dates, or decimal-looking strings should be converted. Use a column `transform` to apply domain-specific conversion.

## Why does a row have multiple issues?

Validation is field-oriented. A row can fail more than one required check, custom validator, transform, or duplicate-key check. Inspect every issue in the row instead of stopping at the first message.

## Streaming does not reduce my memory use

Check whether the callback retains batches or appends them to a global array. The streaming parser does not accumulate the batches, but consumer code can still retain all rows.

## React result is stale or missing

The hook clears the previous result whenever rows or mapping changes. Call `process()` after updating data to generate a new result. Keep the config object referentially stable, for example by declaring it outside the component or memoizing it.
