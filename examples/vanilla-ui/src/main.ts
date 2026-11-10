import { registerImportUI } from "@devkit-forge/import-ui";
import type { ImportUIElement, ImportUIErrorDetail, ImportUILoadedDetail, ImportUIValidatedDetail } from "@devkit-forge/import-ui";
import type { ImportConfig } from "@devkit-forge/import-core";
import "./styles.css";

interface Contact {
  name: string;
  email: string;
}

const config: ImportConfig<Contact> = {
  columns: [
    { key: "name", label: "Name", required: true },
    {
      key: "email",
      label: "Email",
      required: true,
      validate: (value) =>
        typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? undefined
          : "Enter a valid email address.",
    },
  ],
  duplicateKeys: ["email"],
};

registerImportUI();
const importer = document.querySelector<ImportUIElement>("df-data-importer");
const report = document.querySelector<HTMLPreElement>("#report");

if (!importer || !report) {
  throw new Error("The import UI example could not initialize.");
}

importer.configure(config);

importer.addEventListener("df:loaded", (event) => {
  const detail = (event as CustomEvent<ImportUILoadedDetail>).detail;
  report.textContent = [
    `Loaded: ${detail.filename}`,
    `Rows: ${detail.rowCount}`,
    `Headers: ${detail.headers.join(", ")}`,
    ...detail.parserIssues.map((issue) => `Parser issue [${issue.code}]: ${issue.message}`),
    "Click Validate in the component to process the rows.",
  ].join("\n");
});

importer.addEventListener("df:validated", (event) => {
  const { result } = (event as CustomEvent<ImportUIValidatedDetail>).detail;
  report.textContent = [
    `Processed: ${result.totalRows}`,
    `Valid: ${result.validCount}`,
    `Invalid: ${result.invalidCount}`,
    "",
    ...result.invalidRows.flatMap((row) => [
      `Row ${row.rowIndex + 1}:`,
      ...row.issues.map((issue) => `  - ${issue.column}: ${issue.message}`),
    ]),
  ].join("\n");
});

importer.addEventListener("df:error", (event) => {
  const { error } = (event as CustomEvent<ImportUIErrorDetail>).detail;
  report.textContent = `Import error: ${error.message}`;
});
