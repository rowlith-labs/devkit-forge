import type {
  ColumnMapping,
  ImportConfig,
  ProcessRowsResult,
  RawImportRow,
} from "@devkit-forge/import-core";

export interface UseDataImporterOptions<T extends object> {
  /** Schema and validation rules shared with the framework-agnostic core. */
  config: ImportConfig<T>;
  /** Initial source records. Defaults to an empty array. */
  initialRows?: RawImportRow[];
  /** Optional initial source-header to destination-key mapping. */
  initialMapping?: ColumnMapping<T>;
}

export interface UseDataImporterResult<T extends object> {
  rows: RawImportRow[];
  mapping: ColumnMapping<T>;
  result: ProcessRowsResult<T> | null;
  /** Replace source records and clear any previous processing result. */
  setRows: (rows: RawImportRow[]) => void;
  /** Replace the mapping and clear any previous processing result. */
  setMapping: (mapping: ColumnMapping<T>) => void;
  /** Run the core importer against the current rows and mapping. */
  process: () => ProcessRowsResult<T>;
  /** Clear rows, mapping and result, restoring the hook's initial mapping. */
  reset: () => void;
}
