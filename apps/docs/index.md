---
layout: home
hero:
  name: DevKit Forge
  text: Stop rebuilding data-import logic.
  tagline: Give your TypeScript application a reliable way to read spreadsheets, map columns, validate records, and report problems—without handing your data to a hosted import service.
  actions:
    - theme: brand
      text: See how it works
      link: /guide/quick-start
    - theme: alt
      text: Explore real use cases
      link: /guide/use-cases
    - theme: alt
      text: Try the playground
      link: https://github.com/yourdevujjawal/devkit-forge/tree/main/apps/playground
  image:
    src: /devkit-mark.svg
    alt: DevKit Forge mark
features:
  - title: Stop writing the same import plumbing
    details: Reuse parsing, header handling, mapping, validation, duplicate checks, and structured diagnostics instead of rebuilding them for every upload screen.
  - title: Keep control of your data
    details: Files are processed in the consuming application. DevKit Forge does not upload records to a third-party import service or decide where they are saved.
  - title: Fit the stack you already have
    details: Use the framework-independent core on its own, or add CSV, XLSX, React, and Web Component packages as needed.
  - title: Give users useful feedback
    details: Separate valid and invalid rows and inspect row-level issues so your application can explain what needs fixing.
---

## The problem DevKit Forge solves

A common product requirement sounds simple: *let a user upload a spreadsheet and import the records.*

But the actual work quickly grows:

- A customer uploads \`Full Name\`, while your database expects \`name\`.
- A required email is blank or malformed.
- The same customer appears twice in the file.
- A spreadsheet has duplicate or empty column headers.
- One file contains rows that are valid and rows that need correction.
- Your team needs to explain exactly which row failed and why.

Without a reusable import layer, every application ends up rebuilding variations of file parsing, column mapping, validation, duplicate detection, and error reporting. DevKit Forge packages those recurring engineering tasks into composable TypeScript libraries.

## From uploaded file to application-ready records

1. **Read the file.** Parse CSV or XLSX input and inspect headers and parser diagnostics.
2. **Map the columns.** Match source headings to the fields your application expects, or provide an explicit mapping.
3. **Validate the rows.** Apply required checks, transforms, custom validation, and duplicate detection.
4. **Review the result.** Work with valid records and structured issues for invalid rows.
5. **Save using your rules.** Send accepted records to your own API or persistence layer when your application is ready.

DevKit Forge handles the import-processing layer. Your application remains responsible for authentication, permissions, user confirmation, API calls, transactions, and persistence.

## Where it fits

<div class="use-case-grid">
  <div class="use-case-card">
    <h3>Admin bulk uploads</h3>
    <p>Let operations teams add or update customers, contacts, products, or locations from a spreadsheet—with clear feedback when rows do not meet your schema.</p>
  </div>
  <div class="use-case-card">
    <h3>CRM and system migrations</h3>
    <p>Map differently named source columns into your application's destination fields, apply transforms, and identify duplicate keys before your own migration code saves records.</p>
  </div>
  <div class="use-case-card">
    <h3>Inventory and catalogue tools</h3>
    <p>Validate product codes, required descriptions, and duplicate identifiers when staff upload catalogue or stock data.</p>
  </div>
  <div class="use-case-card">
    <h3>Internal operations portals</h3>
    <p>Build import workflows for finance, HR, support, or back-office teams without coupling your business rules to a particular UI framework.</p>
  </div>
</div>

These are examples of workflows you can build with the libraries—not turnkey business applications. You design the review experience and decide what happens after validation. See [more use cases and package combinations](/guide/use-cases).

## Choose only what your application needs

| Package | Use it when you need |
| --- | --- |
| [\`import-core\`](/packages/import-core) | Column mapping, transforms, schema validation, duplicate detection, and row-level results. |
| [\`import-csv\`](/packages/import-csv) | CSV text/file parsing, header diagnostics, or batch streaming for large CSV files. |
| [\`import-xlsx\`](/packages/import-xlsx) | Read XLSX workbooks and worksheets with explicit parsing limits. |
| [\`import-react\`](/packages/import-react) | Keep import rows, mappings, and validation results in React state. |
| [\`import-ui\`](/packages/import-ui) | Add a small framework-independent browser import component. |

You do not need every package. For example, a React application importing CSV files can combine \`import-core\`, \`import-csv\`, and \`import-react\`. A Node.js service that already receives parsed objects may only need \`import-core\`.

## A quick example

Define the shape your application expects, then process source rows against it:

\`\`\`ts
import { createImporter } from "@devkit-forge/import-core";

const importer = createImporter({
  columns: [
    { key: "name", label: "Full name", required: true },
    { key: "email", label: "Email", required: true },
  ],
  duplicateKeys: ["email"],
});

const result = importer.processRows([
  { "Full name": "Ada Lovelace", Email: "ada@example.com" },
  { "Full name": "", Email: "broken@example.com" },
]);

console.log(result.validRows);   // records ready for your next step
console.log(result.invalidRows); // rows with structured issues
\`\`\`

This is the core validation step; add a file parser when your input is a CSV or XLSX file. See the [quick start](/guide/quick-start) for a complete CSV example.

## Is DevKit Forge the right tool?

**A good fit when:**
- Your TypeScript application accepts user-supplied CSV or XLSX data.
- You need consistent mapping and validation across multiple import screens.
- You want to own the UI, API, and persistence while reusing the import engine.
- You need row-level diagnostics or CSV batch processing.

**Not a replacement for:**
- A full ETL/data-integration platform with scheduled pipelines and connectors.
- A hosted file-upload, approval, or background-job service.
- Database migrations or transactional persistence.
- A complete spreadsheet editor or advanced import UI.

## Start building

Read [the use-case guide](/guide/use-cases) to choose an approach, follow the [quick start](/guide/quick-start) to build your first importer, or explore the [runnable examples](/guide/examples).
