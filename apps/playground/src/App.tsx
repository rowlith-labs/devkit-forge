import { useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { ColumnMapping, ImportColumn, ImportConfig } from "@devkit-forge/import-core";
import { parseCsvText } from "@devkit-forge/import-csv";
import { useDataImporter } from "@devkit-forge/import-react";
import { serializeCsv } from "./csv.js";

type Contact = {
  name: string;
  email: string;
  company: string;
};

const columns: ImportColumn<Contact>[] = [
  { key: "name", label: "Full name", required: true },
  {
    key: "email",
    label: "Email address",
    required: true,
    validate: (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? undefined
      : "Enter a valid email address.",
  },
  { key: "company", label: "Company" },
];
const config: ImportConfig<Contact> = { columns, duplicateKeys: ["email"] };
const sampleCsv = "Full name,Email address,Company\nAda Lovelace,ada@example.com,Analytical Engines\nGrace Hopper,grace@example.com,US Navy\n,missing@example.com,Unknown\nAlan Turing,ada@example.com,Bletchley Park\n";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const importer = useDataImporter<Contact>({ config });
  const [filename, setFilename] = useState("sample-contacts.csv");
  const [headers, setHeaders] = useState<string[]>(["Full name", "Email address", "Company"]);
  const [csvIssues, setCsvIssues] = useState<string[]>([]);
  const [mappingEdited, setMappingEdited] = useState(false);
  const [filter, setFilter] = useState<"all" | "valid" | "invalid">("all");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const suggestedMapping = useMemo(() => {
    const mapping: ColumnMapping<Contact> = {};
    for (const header of headers) {
      const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = columns.find((column) =>
        [column.key, column.label].some((candidate) =>
          candidate.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized,
        ),
      );
      if (match) mapping[header] = match.key;
    }
    return mapping;
  }, [headers]);

  const mapping = mappingEdited ? importer.mapping : suggestedMapping;
  const result = importer.result;
  const issuesByRow = useMemo(() => {
    const map = new Map<number, NonNullable<typeof result>["invalidRows"][number]["issues"]>();
    result?.invalidRows.forEach((row) => map.set(row.rowIndex, row.issues));
    return map;
  }, [result]);

  const visibleRows = useMemo(() => {
    const rows = importer.rows.map((row, index) => ({ row, index }));
    if (filter === "valid") return rows.filter(({ index }) => !issuesByRow.has(index) && result !== null);
    if (filter === "invalid") return rows.filter(({ index }) => issuesByRow.has(index));
    return rows;
  }, [filter, importer.rows, issuesByRow, result]);

  async function loadFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setCsvIssues([]);
    setFilter("all");
    setMappingEdited(false);
    importer.reset();
    try {
      const parsed = parseCsvText(await file.text());
      setFilename(file.name);
      setHeaders(parsed.headers);
      setCsvIssues(parsed.issues.map((issue) => issue.message));
      if (!parsed.records) {
        importer.setRows([]);
        setCsvIssues((current) => [...current, "This file has empty or duplicate headers. Rename the headers and upload it again."]);
        return;
      }
      importer.setRows(parsed.records);
    } catch (error) {
      setCsvIssues([error instanceof Error ? error.message : "Could not read this file."]);
    } finally {
      setBusy(false);
    }
  }

  function updateMapping(header: string, value: string) {
    const next: ColumnMapping<Contact> = { ...mapping };
    if (value === "") delete next[header];
    else next[header] = value as keyof Contact;
    setMappingEdited(true);
    importer.setMapping(next);
  }

  function processRows() {
    importer.process();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void loadFile(event.dataTransfer.files[0]);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void loadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function exportValid() {
    if (!result) return;
    downloadCsv("valid-contacts.csv", columns.map((column) => column.label),
      result.validRows.map((row) => columns.map((column) => row[column.key])));
  }

  function exportErrors() {
    if (!result) return;
    const rows = result.invalidRows.flatMap((item) =>
      item.issues.map((issue) => [item.rowIndex + 1, issue.column, issue.code, issue.message, String(issue.value ?? "")]),
    );
    downloadCsv("import-errors.csv", ["Row", "Field", "Code", "Message", "Value"], rows);
  }

  const total = result?.totalRows ?? importer.rows.length;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="DevKit Forge home"><span className="brand-mark">DF</span> DevKit Forge</a>
        <span className="top-note">OPEN-SOURCE DEVELOPER TOOLS</span>
        <a className="github-link" href="https://github.com/truerdp/devkit-forge" target="_blank" rel="noreferrer">GitHub ↗</a>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> INTERACTIVE PLAYGROUND</div>
        <h1>Import data.<br /><span>Without the busywork.</span></h1>
        <p>Upload a CSV, map columns, validate every row, and export clean data. Everything runs locally in your browser.</p>
        <div className="hero-meta"><span><i className="dot green" /> Local processing</span><span>·</span><span>Powered by DevKit Forge packages</span></div>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><span className="step">01</span><h2>Choose a CSV file</h2></div><button className="text-button" onClick={() => void loadFile(new File([sampleCsv], "sample-contacts.csv", { type: "text/csv" }))}>Load sample data ↗</button></div>
        <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
          <div className="upload-icon">↑</div>
          <strong>{busy ? "Reading your file…" : "Drop your CSV file here"}</strong>
          <span>or <label className="browse">browse files<input type="file" accept=".csv,text/csv" onChange={onFileChange} /></label></span>
          <small>CSV only · Processed on this device · No upload to a server</small>
        </div>
        {filename && <div className="file-pill"><span className="file-icon">CSV</span><span>{filename}</span><span className="file-count">{total} rows</span></div>}
        {csvIssues.length > 0 && <div className="notice warning">{csvIssues.map((issue, index) => <p key={index}>{issue}</p>)}</div>}
      </section>

      <section className="workspace">
        <div className="section-heading"><div><span className="step">02</span><h2>Map your columns</h2></div><span className="muted-label">Match source fields to your schema</span></div>
        <div className="mapping-list">
          {columns.map((column) => {
            const source = headers.find((header) => mapping[header] === column.key);
            return <div className="mapping-row" key={column.key}>
              <div><strong>{column.label}</strong><small>{column.key}{column.required ? " · Required" : " · Optional"}</small></div>
              <span className="mapping-arrow">←</span>
              <select aria-label={`Map ${column.label}`} value={source ?? ""} onChange={(event) => {
                const next = { ...mapping };
                Object.keys(next).forEach((key) => { if (next[key] === column.key) delete next[key]; });
                if (event.target.value) next[event.target.value] = column.key;
                setMappingEdited(true);
                importer.setMapping(next);
              }}>
                <option value="">Not mapped</option>
                {headers.map((header, index) => <option key={`${header}-${index}`} value={header}>{header}</option>)}
              </select>
              {source ? <span className="mapped-status">Matched</span> : <span className="unmapped-status">Unmapped</span>}
            </div>;
          })}
        </div>
        <div className="action-row"><span className="hint">Automatic header matching is used until you edit a mapping.</span><button className="primary-button" onClick={processRows} disabled={importer.rows.length === 0}>Validate {importer.rows.length} rows <span>→</span></button></div>
      </section>

      <section className="workspace results-section">
        <div className="section-heading"><div><span className="step">03</span><h2>Validation results</h2></div><span className="muted-label">{result ? "Latest validation" : "Run validation to see results"}</span></div>
        <div className="stats-grid">
          <div className="stat-card"><span>Total rows</span><strong>{result?.totalRows ?? total}</strong><small>Records detected</small></div>
          <div className="stat-card"><span>Valid rows</span><strong className="success-text">{result?.validCount ?? "—"}</strong><small>Ready to export</small></div>
          <div className="stat-card"><span>Invalid rows</span><strong className="error-text">{result?.invalidCount ?? "—"}</strong><small>Need attention</small></div>
        </div>
        {result && <>
          <div className="result-toolbar">
            <div className="filters" role="group" aria-label="Filter rows">
              {(["all", "valid", "invalid"] as const).map((value) => <button key={value} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)} {value === "all" ? result.totalRows : value === "valid" ? result.validCount : result.invalidCount}</button>)}
            </div>
            <div className="export-actions"><button className="secondary-button" onClick={exportErrors} disabled={result.invalidCount === 0}>↓ Error report</button><button className="primary-button compact" onClick={exportValid} disabled={result.validCount === 0}>↓ Export valid CSV</button></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Row</th>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Status / issues</th></tr></thead>
              <tbody>{visibleRows.map(({ row, index }) => {
                const issues = issuesByRow.get(index) ?? [];
                return <tr key={index}>
                  <td className="row-number">{index + 1}</td>
                  {columns.map((column) => <td key={column.key}>{String(row[column.key] ?? "—")}</td>)}
                  <td>{issues.length === 0 ? <span className="status valid">Valid</span> : <div className="issue-list">{issues.map((issue, issueIndex) => <span key={issueIndex} title={issue.message}>{issue.column}: {issue.message}</span>)}</div>}</td>
                </tr>;
              })}</tbody>
            </table>
            {visibleRows.length === 0 && <div className="empty-state">No rows match this filter.</div>}
          </div>
        </>}
        {!result && <div className="empty-placeholder"><span>✓</span><p>Your row-level validation report will appear here.</p></div>}
      </section>

      <footer><span>DEVKIT FORGE <b>·</b> OPEN SOURCE</span><span>Built for developers who care about good data.</span></footer>
    </main>
  );
}
