export type RawImportRow = Record<string, unknown>;

export interface ImportIssue {
  rowIndex: number;
  column: string;
  value: unknown;
  code: "required" | "invalid" | "duplicate" | "unmapped";
  message: string;
}

export interface ImportColumn<T extends object> {
  key: keyof T & string;
  label: string;
  required?: boolean;
  transform?: (value: unknown, sourceRow: RawImportRow) => unknown;
  validate?: (
    value: unknown,
    row: Partial<T>,
  ) => string | undefined;
}

export type ColumnMapping<T extends object> = Partial<
  Record<string, keyof T & string>
>;

export interface ImportConfig<T extends object> {
  columns: ImportColumn<T>[];
  duplicateKeys?: (keyof T & string)[];
}

export interface ProcessRowsResult<T extends object> {
  validRows: T[];
  invalidRows: Array<{ rowIndex: number; row: Partial<T>; issues: ImportIssue[] }>;
  totalRows: number;
  validCount: number;
  invalidCount: number;
}
