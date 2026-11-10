# Use cases: when should you use Rowlith?

Rowlith is for application developers who need to accept structured data from files or existing JavaScript records and turn it into validated records that their own application can process.

It is not a hosted import product. It is a set of libraries for the import-processing part of a workflow.

## 1. Admin bulk uploads

**Scenario:** An administrator needs to add 500 customers to a CRM or update product records from a spreadsheet.

Typical challenges:
- Spreadsheet headings do not match the application's property names.
- Required fields are missing or invalid.
- Duplicate identifiers appear in the same upload.
- The administrator needs to know which rows need correction.

**How Rowlith helps:** Use a CSV or XLSX adapter to read the file, then use \`import-core\` to map fields, validate values, detect duplicates, and return valid and invalid rows separately.

**Your application still owns:** The upload screen, access control, preview/confirmation, API calls, and database writes.

## 2. CRM or legacy-system migration

**Scenario:** A team is moving records from an old system or another vendor. The source file uses headings and formats that differ from the destination model.

**How Rowlith helps:** Map source headings to destination keys, use transforms to normalize values, validate required fields, and identify duplicate keys before handing records to your migration or API layer.

This is useful for repeatable file-based migration steps. It does not replace a full ETL pipeline, source-system connector, migration scheduler, or transaction manager.

## 3. Inventory and product catalogue imports

**Scenario:** Staff upload product catalogues, stock lists, or location records maintained in spreadsheets.

**How Rowlith helps:** Parse CSV/XLSX input, check required fields such as SKU or product name, detect repeated identifiers, and expose row-level diagnostics for the review interface you build.

The library does not know your inventory rules automatically. You define the destination schema and custom validation logic.

## 4. Internal operations tools

**Scenario:** An internal finance, HR, support, or operations portal needs a repeatable way to accept structured data from non-technical teams.

**How Rowlith helps:** Keep import rules independent of the UI framework. Use the core package in a service or browser application, then add the React hook or Web Component only if it fits your interface.

## 5. Large CSV processing in the browser

**Scenario:** Users need to process CSV files that are too large to comfortably read and retain all at once.

**How Rowlith helps:** Use \`streamCsvFile\` from \`@rowlith/import-csv\` to process rows in batches. The callback receives each batch so your application can process or persist it before the next batch. Avoid collecting all batches in memory.

This streaming API is for CSV. The current XLSX adapter loads workbooks into memory and is not a streaming XLSX parser.

## Pick the package combination

| Your situation | Start with |
| --- | --- |
| You already have JavaScript records and need mapping/validation | \`@rowlith/import-core\` |
| You need to read CSV files | \`@rowlith/import-csv\` + \`@rowlith/import-core\` |
| You need to read Excel workbooks | \`@rowlith/import-xlsx\` + \`@rowlith/import-core\` |
| You use React and want import state in a hook | Add \`@rowlith/import-react\` |
| You want a small framework-independent browser component | Add \`@rowlith/import-ui\` |

You can combine adapters as needed. The React hook is headless and does not parse files itself. The Web Component can load CSV/XLSX files but is intended for ordinary in-memory files, not very large streaming imports.

## What Rowlith does not do

To keep the boundary clear, Rowlith does not:
- Upload files or records to a Rowlith server.
- Authenticate users or authorize imports.
- Save records to your database or call your backend automatically.
- Provide scheduled ETL pipelines or connectors to external systems.
- Guarantee that imported data is correct for your business; you define the schema and validation rules.

## Next steps

- Follow the [quick start](/guide/quick-start) to build a CSV importer.
- Read [validation and mapping](/guide/validation-and-mapping) to understand how source columns are matched.
- Explore [large CSV files](/guide/large-files) if you need batch processing.
- Run the [examples](/guide/examples) to see integrations in context.
