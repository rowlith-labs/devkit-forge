import { createImporter, normalizeHeader } from "@devkit-forge/import-core";
import type {
  ColumnMapping,
  ImportConfig,
  ProcessRowsResult,
  RawImportRow,
} from "@devkit-forge/import-core";
import { parseCsvFile } from "@devkit-forge/import-csv";
import { parseXlsxFile } from "@devkit-forge/import-xlsx";
import type {
  ImportUIElement,
  ImportUIErrorDetail,
  ImportUILoadedDetail,
  ImportUIValidatedDetail,
} from "./types.js";

const DEFAULT_TAG_NAME = "df-data-importer";
const styles = `
  :host { display:block; color:var(--df-text,#20252d); font:inherit; }
  * { box-sizing:border-box; }
  .panel { border:1px solid var(--df-border,#dfe3e8); border-radius:14px; padding:1rem; background:var(--df-surface,#fff); }
  .toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:.75rem; }
  input[type=file] { max-width:100%; }
  button,select { font:inherit; min-height:40px; border:1px solid var(--df-border,#cbd1d9); border-radius:8px; padding:.5rem .75rem; background:var(--df-control,#fff); color:inherit; }
  button { cursor:pointer; }
  button:disabled { cursor:not-allowed; opacity:.55; }
  button.primary { background:var(--df-accent,#2457d6); border-color:var(--df-accent,#2457d6); color:#fff; }
  button:focus-visible,select:focus-visible,input:focus-visible { outline:3px solid var(--df-focus,#8ab4ff); outline-offset:2px; }
  .status { margin:.75rem 0; min-height:1.5em; color:var(--df-muted,#5e6672); }
  .issues { color:var(--df-danger,#a32323); padding-left:1.25rem; }
  .mapping { display:grid; gap:.5rem; margin:1rem 0; }
  .mapping-row { display:grid; grid-template-columns:minmax(8rem,1fr) minmax(8rem,1fr); align-items:center; gap:.75rem; }
  .mapping-row label { overflow-wrap:anywhere; }
  .summary { display:flex; flex-wrap:wrap; gap:1rem; margin:.75rem 0; }
  .summary strong { font-variant-numeric:tabular-nums; }
  .table-wrap { overflow:auto; max-width:100%; }
  table { width:100%; border-collapse:collapse; font-size:.9em; }
  th,td { text-align:left; padding:.6rem; border-bottom:1px solid var(--df-border,#e5e7eb); vertical-align:top; }
  th { background:var(--df-header,#f6f7f9); }
  .valid { color:var(--df-success,#176b3a); }
  .invalid { color:var(--df-danger,#a32323); }
  .muted { color:var(--df-muted,#5e6672); }
  @media (max-width:520px) { .mapping-row { grid-template-columns:1fr; gap:.25rem; } .panel { padding:.75rem; } }
`;

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Registers a native Web Component. No framework runtime is required.
 * Call once in a browser entry point, then configure the element with a schema.
 */
export function registerImportUI(
  registry: CustomElementRegistry = customElements,
  tagName = DEFAULT_TAG_NAME,
): CustomElementConstructor {
  if (!/^[a-z][.0-9_a-z-]*-[.0-9_a-z-]*$/.test(tagName)) {
    throw new TypeError("Custom element tag names must be valid hyphenated names.");
  }
  const existing = registry.get(tagName);
  if (existing) return existing;

  class DevKitDataImporterElement extends HTMLElement implements ImportUIElement {
    private config: ImportConfig<Record<string, unknown>> | null = null;
    private rows: RawImportRow[] = [];
    private headers: string[] = [];
    private mapping: ColumnMapping<Record<string, unknown>> | undefined;
    private latestResult: ProcessRowsResult<Record<string, unknown>> | null = null;
    private parserIssues: Array<{ code: string; message: string }> = [];
    private filename = "";\n    private listenersAttached = false;

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.renderShell();
    }

    get result(): ProcessRowsResult<Record<string, unknown>> | null {
      return this.latestResult;
    }

    connectedCallback(): void {
      if (this.listenersAttached) return;
      this.listenersAttached = true;
      this.shadowRoot?.querySelector<HTMLInputElement>("[data-file]")?.addEventListener("change", (event) => {
        const file = (event.currentTarget as HTMLInputElement).files?.[0];
        if (file) void this.loadFile(file);
      });
      this.shadowRoot?.querySelector<HTMLButtonElement>("[data-validate]")?.addEventListener("click", () => {
        try { this.validate(); } catch (error) { this.emitError(error); }
      });
      this.shadowRoot?.querySelector<HTMLButtonElement>("[data-reset]")?.addEventListener("click", () => this.reset());
    }

    configure<T extends object>(config: ImportConfig<T>): void {
      // The public generic schema is retained by the caller; the UI exposes a
      // string-keyed result shape because custom elements cannot carry TS generics.
      this.config = config as unknown as ImportConfig<Record<string, unknown>>;
      createImporter(this.config);
      this.latestResult = null;
      this.renderMapping();
      this.renderResults();
    }

    setRows(rows: RawImportRow[], headers = rows[0] ? Object.keys(rows[0]) : []): void {
      this.rows = rows.map((row) => ({ ...row }));
      this.filename = "";
      this.headers = [...headers];
      this.mapping = undefined;
      this.latestResult = null;
      this.parserIssues = [];
      this.renderMapping();
      this.renderResults();
      this.setStatus(`${this.rows.length} rows ready for mapping and validation.`);
      this.dispatchEvent(new CustomEvent<ImportUILoadedDetail>("df:loaded", {
        detail: { filename: this.filename, headers: [...this.headers], rowCount: this.rows.length, parserIssues: [] },
        bubbles: true,
        composed: true,
      }));
    }

    setMapping(mapping: ColumnMapping<Record<string, unknown>>): void {
      this.mapping = { ...mapping };
      this.latestResult = null;
      this.renderMapping();
      this.renderResults();
    }

    async loadFile(file: File): Promise<void> {
      this.setBusy(true);
      try {
        const name = file.name.toLowerCase();
        let records: RawImportRow[] | null;
        let headers: string[];
        let parserIssues: Array<{ code: string; message: string }>;
        if (name.endsWith(".csv") || file.type === "text/csv") {
          const parsed = await parseCsvFile(file);
          records = parsed.records;
          headers = parsed.headers;
          parserIssues = parsed.issues;
        } else if (name.endsWith(".xlsx") || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
          const parsed = await parseXlsxFile(file);
          records = parsed.records;
          headers = parsed.headers;
          parserIssues = parsed.issues;
        } else {
          throw new TypeError("Choose a .csv or .xlsx file.");
        }
        if (!records) {
          throw new Error("The file has empty or duplicate headers. Correct the headers before importing.");
        }
        this.filename = file.name;
        this.rows = records;
        this.headers = headers;
        this.mapping = undefined;
        this.latestResult = null;
        this.parserIssues = parserIssues;
        this.renderMapping();
        this.renderResults();
        this.setStatus(`${records.length} rows loaded from ${file.name}.`);
        this.dispatchEvent(new CustomEvent<ImportUILoadedDetail>("df:loaded", {
          detail: { filename: file.name, headers: [...headers], rowCount: records.length, parserIssues: [...parserIssues] },
          bubbles: true,
          composed: true,
        }));
      } catch (error) {
        this.emitError(error);
      } finally {
        this.setBusy(false);
      }
    }

    validate(): ProcessRowsResult<Record<string, unknown>> {
      if (!this.config) throw new Error("Call configure() with an import schema before validating.");
      if (this.rows.length === 0) throw new Error("Load a file or set rows before validating.");
      const importer = createImporter(this.config);
      this.latestResult = importer.processRows(this.rows, this.mapping);
      this.renderResults();
      this.setStatus(`Validation complete: ${this.latestResult.validCount} valid, ${this.latestResult.invalidCount} invalid.`);
      this.dispatchEvent(new CustomEvent<ImportUIValidatedDetail>("df:validated", {
        detail: { result: this.latestResult },
        bubbles: true,
        composed: true,
      }));
      return this.latestResult;
    }

    reset(): void {
      this.rows = [];
      this.headers = [];
      this.mapping = undefined;
      this.latestResult = null;
      this.parserIssues = [];
      this.filename = "";
      const input = this.shadowRoot?.querySelector<HTMLInputElement>("[data-file]");
      if (input) input.value = "";
      this.renderMapping();
      this.renderResults();
      this.setStatus("Choose a CSV or XLSX file to begin.");
    }

    private renderShell(): void {
      if (!this.shadowRoot) return;
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <section class="panel" aria-label="Data importer">
          <div class="toolbar">
            <label>Choose file <input data-file type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label>
            <button type="button" data-reset>Reset</button>
          </div>
          <p class="status" data-status role="status" aria-live="polite">Choose a CSV or XLSX file to begin.</p>
          <ul class="issues" data-issues aria-label="File diagnostics"></ul>
          <section aria-label="Column mapping">
            <h3>Map columns</h3>
            <div class="mapping" data-mapping></div>
          </section>
          <div class="toolbar"><button class="primary" type="button" data-validate disabled>Validate rows</button></div>
          <section aria-label="Validation results">
            <div class="summary" data-summary aria-live="polite"></div>
            <div class="table-wrap" data-results></div>
          </section>
        </section>`;
    }

    private setStatus(message: string): void {
      const status = this.shadowRoot?.querySelector<HTMLElement>("[data-status]");
      if (status) status.textContent = message;
    }

    private setBusy(busy: boolean): void {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>("[data-file]");
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("[data-validate]");
      if (input) input.disabled = busy;
      if (button) button.disabled = busy || this.rows.length === 0 || !this.config;
    }

    private emitError(error: unknown): void {
      const normalized = asError(error);
      this.setStatus(normalized.message);
      this.dispatchEvent(new CustomEvent<ImportUIErrorDetail>("df:error", {
        detail: { error: normalized },
        bubbles: true,
        composed: true,
      }));
    }

    private renderMapping(): void {
      const container = this.shadowRoot?.querySelector<HTMLElement>("[data-mapping]");
      if (!container) return;
      container.replaceChildren();
      if (!this.config || this.headers.length === 0) {
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = "Load a file to configure source-to-schema mappings.";
        container.append(note);
      } else {
        for (const header of this.headers) {
          const row = document.createElement("div");
          row.className = "mapping-row";
          const label = document.createElement("label");
          const select = document.createElement("select");
          const id = `df-map-${this.headers.indexOf(header)}`;
          label.htmlFor = id;
          label.textContent = header || "(empty header)";
          select.id = id;
          const automatic = document.createElement("option");
          automatic.value = "";
          automatic.textContent = this.mapping === undefined ? "Automatic matching" : "Not mapped";
          select.append(automatic);
          for (const column of this.config.columns) {
            const option = document.createElement("option");
            option.value = column.key;
            option.textContent = column.label;
            select.append(option);
          }
          select.value = this.mapping?.[header] ?? "";
          select.addEventListener("change", () => {
            const next = { ...(this.mapping ?? {}) };
            if (select.value) next[header] = select.value;
            else delete next[header];
            this.setMapping(next);
          });
          row.append(label, select);
          container.append(row);
        }
      }
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("[data-validate]");
      if (button) button.disabled = this.rows.length === 0 || !this.config;
    }

    private renderResults(): void {
      const summary = this.shadowRoot?.querySelector<HTMLElement>("[data-summary]");
      const results = this.shadowRoot?.querySelector<HTMLElement>("[data-results]");
      const issues = this.shadowRoot?.querySelector<HTMLElement>("[data-issues]");
      if (!summary || !results || !issues) return;
      summary.replaceChildren();
      results.replaceChildren();
      issues.replaceChildren();
      for (const issue of this.parserIssues) {
        const item = document.createElement("li");
        item.textContent = issue.message;
        issues.append(item);
      }
      if (!this.latestResult) return;
      const counts = [
        ["Total", this.latestResult.totalRows],
        ["Valid", this.latestResult.validCount],
        ["Invalid", this.latestResult.invalidCount],
      ];
      for (const [label, value] of counts) {
        const item = document.createElement("span");
        item.textContent = `${label}: ${value}`;
        summary.append(item);
      }
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      for (const name of [...this.config!.columns.map((column) => column.label), "Status"]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = name;
        headerRow.append(cell);
      }
      thead.append(headerRow);
      const tbody = document.createElement("tbody");
      const invalidByIndex = new Map(this.latestResult.invalidRows.map((item) => [item.rowIndex, item]));
      this.rows.forEach((source, index) => {
        const invalid = invalidByIndex.get(index);
        const tr = document.createElement("tr");
        for (const column of this.config!.columns) {
          const td = document.createElement("td");
          const header = this.mapping === undefined
            ? this.headers.find((name) => name.trim().toLowerCase() === column.label.trim().toLowerCase()
              || name.trim().toLowerCase() === column.key.toLowerCase())
            : Object.keys(this.mapping).find((name) => this.mapping?.[name] === column.key);
          td.textContent = header ? String(source[header] ?? "") : "";
          tr.append(td);
        }
        const status = document.createElement("td");
        status.className = invalid ? "invalid" : "valid";
        status.textContent = invalid ? invalid.issues.map((issue) => issue.message).join("; ") : "Valid";
        tr.append(status);
        tbody.append(tr);
      });
      table.append(thead, tbody);
      results.append(table);
    }
  }

  registry.define(tagName, DevKitDataImporterElement);
  return DevKitDataImporterElement;
}
