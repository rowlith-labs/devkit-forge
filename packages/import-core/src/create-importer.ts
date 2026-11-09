import type {
  ColumnMapping,
  ImportConfig,
  ImportIssue,
  ProcessRowsResult,
  RawImportRow,
} from "./types.js";
import { normalizeHeader } from "./normalize-headers.js";

export interface Importer<T extends object> {
  processRows(
    sourceRows: RawImportRow[],
    mapping?: ColumnMapping<T>,
  ): ProcessRowsResult<T>;
}

export function createImporter<T extends object>(
  config: ImportConfig<T>,
): Importer<T> {
  const configuredKeys = new Set(config.columns.map((column) => column.key));

  for (const key of config.duplicateKeys ?? []) {
    if (!configuredKeys.has(key)) {
      throw new Error(`Duplicate key "${key}" is not defined in columns.`);
    }
  }

  return {
    processRows(sourceRows, suppliedMapping = {}) {
      const validRows: T[] = [];
      const invalidRows: ProcessRowsResult<T>["invalidRows"] = [];
      const seen = new Map<string, Set<string>>();

      for (const key of config.duplicateKeys ?? []) {
        seen.set(key, new Set());
      }

      sourceRows.forEach((sourceRow, rowIndex) => {
        const mappedRow: Record<string, unknown> = {};
        const issues: ImportIssue[] = [];

        for (const column of config.columns) {
          const sourceHeader = Object.keys(sourceRow).find((header) => {
            const mappedKey = suppliedMapping[header];
            if (mappedKey) return mappedKey === column.key;
            return normalizeHeader(header) === normalizeHeader(column.label)
              || normalizeHeader(header) === normalizeHeader(column.key);
          });

          const rawValue = sourceHeader === undefined ? undefined : sourceRow[sourceHeader];
          const value = column.transform
            ? column.transform(rawValue, sourceRow)
            : rawValue;

          mappedRow[column.key] = value;

          if (column.required && (value === undefined || value === null || value === "")) {
            issues.push({
              rowIndex,
              column: column.key,
              value,
              code: "required",
              message: `${column.label} is required.`,
            });
            continue;
          }

          const validationMessage = column.validate?.(value, mappedRow);
          if (validationMessage) {
            issues.push({
              rowIndex,
              column: column.key,
              value,
              code: "invalid",
              message: validationMessage,
            });
          }
        }

        for (const key of config.duplicateKeys ?? []) {
          const value = mappedRow[key];
          if (value === undefined || value === null || value === "") continue;

          const normalizedValue = String(value).trim().toLowerCase();
          const values = seen.get(key)!;
          if (values.has(normalizedValue)) {
            issues.push({
              rowIndex,
              column: key,
              value,
              code: "duplicate",
              message: `Duplicate value for ${key}.`,
            });
          } else {
            values.add(normalizedValue);
          }
        }

        if (issues.length > 0) {
          invalidRows.push({ rowIndex, row: mappedRow, issues });
        } else {
          validRows.push(mappedRow as T);
        }
      });

      return {
        validRows,
        invalidRows,
        totalRows: sourceRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
      };
    },
  };
}
