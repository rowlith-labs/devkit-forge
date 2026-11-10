import { useState } from "react";
import { parseCsvFile } from "@rowlith/import-csv";
import type { ImportConfig } from "@rowlith/import-core";
import { useDataImporter } from "@rowlith/import-react";

interface Contact {
  name: string;
  email: string;
  company: string;
}

const config: ImportConfig<Contact> = {
  columns: [
    { key: "name", label: "Full Name", required: true },
    {
      key: "email",
      label: "Email",
      required: true,
      validate: (value) =>
        typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? undefined
          : "Enter a valid email address.",
    },
    { key: "company", label: "Company" },
  ],
  duplicateKeys: ["email"],
};

const sampleCsv = [
  "Full Name,Email,Company",
  "Ada Lovelace,ada@example.com,Analytical Engines",
  "Grace Hopper,grace@example.com,US Navy",
  "Alan Turing,not-an-email,Bletchley Park",
  "Duplicate Ada,ada@example.com,Example Co",
].join("\n");

export default function App() {
  const importer = useDataImporter<Contact>({ config });
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [parserMessage, setParserMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setParserMessage("");
    setFilename(file.name);
    try {
      const parsed = await parseCsvFile(file);
      setHeaders(parsed.headers);
      if (parsed.records === null) {
        importer.setRows([]);
        setParserMessage("Headers must be non-empty and unique before records can be mapped.");
      } else {
        importer.setRows(parsed.records);
        setParserMessage(
          parsed.issues.length
            ? parsed.issues.map((issue) => issue.message).join(" ")
            : `Parsed ${parsed.rowCount} rows.`,
        );
      }
    } catch (error) {
      importer.setRows([]);
      setParserMessage(error instanceof Error ? error.message : "Unable to parse this CSV file.");
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    const file = new File([sampleCsv], "sample-contacts.csv", { type: "text/csv" });
    await loadFile(file);
  }

  const result = importer.result;

  return (
    <main className="shell">
      <header className="hero">
        <a className="wordmark" href="https://github.com/rowlith-labs/rowlith">ROWLITH</a>
        <span className="eyebrow">OPEN-SOURCE DATA IMPORT TOOLKIT</span>
        <h1>From CSV to <span>trusted records.</span></h1>
        <p className="intro">
          A small, real-world React example using the CSV parser, schema-driven
          validation, automatic header mapping, and duplicate detection.
        </p>
        <div className="actions">
          <label className="upload">
            {busy ? "Parsing…" : "Choose a CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(event) => void loadFile(event.target.files?.[0])}
            />
          </label>
          <button className="secondary" type="button" onClick={() => void loadSample()} disabled={busy}>
            Load sample data
          </button>
          <button className="ghost" type="button" onClick={() => { importer.reset(); setFilename(""); setHeaders([]); setParserMessage(""); }}>
            Reset
          </button>
        </div>
        {filename && <p className="fileline">File: <strong>{filename}</strong></p>}
        {parserMessage && <p className="notice" role="status">{parserMessage}</p>}
      </header>

      {headers.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <div><span className="eyebrow">STEP 01</span><h2>Detected columns</h2></div>
            <span className="count">{headers.length} headers</span>
          </div>
          <div className="chips">{headers.map((header, index) => <span className="chip" key={index}>{header || "(empty)"}</span>)}</div>
          <p className="hint">The core engine maps normalized source headers to schema labels or keys. You can provide an explicit mapping when your source format needs custom handling.</p>
        </section>
      )}

      {importer.rows.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <div><span className="eyebrow">STEP 02</span><h2>Validate records</h2></div>
            <span className="count">{importer.rows.length} source rows</span>
          </div>
          <p className="hint">Validation is explicit. Nothing is uploaded or saved by this example.</p>
          <button className="primary" type="button" onClick={() => importer.process()}>
            Validate {importer.rows.length} rows
          </button>
        </section>
      )}

      {result && (
        <section className="panel">
          <div className="section-heading">
            <div><span className="eyebrow">STEP 03</span><h2>Validation report</h2></div>
            <span className="count">{result.totalRows} processed</span>
          </div>
          <div className="stats">
            <div><strong>{result.validCount}</strong><span>Valid</span></div>
            <div><strong>{result.invalidCount}</strong><span>Needs attention</span></div>
          </div>
          {result.validRows.length > 0 && (
            <>
              <h3>Ready to import</h3>
              <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Company</th></tr></thead>
                <tbody>{result.validRows.map((row, index) => <tr key={index}><td>{row.name}</td><td>{row.email}</td><td>{row.company}</td></tr>)}</tbody>
              </table></div>
            </>
          )}
          {result.invalidRows.length > 0 && (
            <>
              <h3>Rows to fix</h3>
              <div className="issues">{result.invalidRows.map((entry) => (
                <article className="issue" key={entry.rowIndex}>
                  <strong>Source row {entry.rowIndex + 1}</strong>
                  <span>{String(entry.row.name ?? "Unnamed record")}</span>
                  <ul>{entry.issues.map((issue, index) => <li key={index}>{issue.column}: {issue.message}</li>)}</ul>
                </article>
              ))}</div>
            </>
          )}
        </section>
      )}

      <footer>Files are parsed locally in your browser. Explore the packages and source on <a href="https://github.com/rowlith-labs/rowlith">GitHub</a>.</footer>
    </main>
  );
}
