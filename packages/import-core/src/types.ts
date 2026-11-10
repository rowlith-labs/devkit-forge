export type RawImportRow = Record<string, unknown>;

export interface ImportIssue {
  /** Zero-based index in the input array. */
  rowIndex: number;
  column: string;
  value: unknown;
  code: "required" | "invalid" | "duplicate" | "ambiguous";
  message: string;
}

export interface ImportColumn<T extends object> {
  key: keyof T & string;
  label: string;
  required?: boolean;
  transform?: (value: unknown, sourceRow: RawImportRow) => unknown;
  validate?: (value: unknown, row: Partial<T>) => string | undefined;
}

/** Maps source header names to destination schema keys. */
export type ColumnMapping<T extends object> = Partial<Record<string, keyof T & string>>;

export interface ImportConfig<T extends object> {
  columns: ImportColumn<T>[];
  /** Values are compared case-insensitively after trimming and string conversion. */
  duplicateKeys?: (keyof T & string)[];
}

export interface InvalidImportRow<T extends object> {
  rowIndex: number;
  row: Partial<T>;
  issues: ImportIssue[];
}

export interface ProcessRowsResult<T extends object> {
  validRows: T[];
  invalidRows: InvalidImportRow<T>[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}
