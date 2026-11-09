import type {
  ColumnMapping,
  ImportConfig,
  ProcessRowsResult,
  RawImportRow,
} from "@devkit-forge/import-core";

export interface ImportUILoadedDetail {
  filename: string;
  headers: string[];
  rowCount: number;
  parserIssues: Array<{ code: string; message: string }>;
}

export interface ImportUIValidatedDetail {
  result: ProcessRowsResult<Record<string, unknown>>;
}

export interface ImportUIErrorDetail {
  error: Error;
}

export interface ImportUIElement extends HTMLElement {
  configure<T extends object>(config: ImportConfig<T>): void;
  setRows(rows: RawImportRow[], headers?: string[]): void;
  setMapping(mapping: ColumnMapping<Record<string, unknown>>): void;
  loadFile(file: File): Promise<void>;
  validate(): ProcessRowsResult<Record<string, unknown>>;
  reset(): void;
  readonly result: ProcessRowsResult<Record<string, unknown>> | null;
}