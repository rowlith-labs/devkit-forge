import type {
  ColumnMapping,
  ImportConfig,
  ImportIssue,
  ProcessRowsResult,
  RawImportRow,
} from "./types.js";
import { normalizeHeader } from "./normalize-headers.js";

export interface Importer<T extends object> {
  /**
   * Processes in-memory records. Row indexes are zero-based.
   *
   * When mapping is omitted, headers are matched against each column's label
   * or key. When mapping is supplied, it is authoritative: unmapped headers
   * are not guessed automatically.
   */
  processRows(
    sourceRows: RawImportRow[],
    mapping?: ColumnMapping<T>,
  ): ProcessRowsResult<T>;
}

function isMissing(value: unknown): boolean {
  return value === undefined
    || value === null
    || (typeof value === "string" && value.trim() === "");
}

function normalizeDuplicateValue(value: unknown): string {
  return String(value).trim().toLocaleLowerCase();
}

export function createImporter<T extends object>(
  config: ImportConfig<T>,
): Importer<T> {
  const configuredKeys = new Set(config.columns.map((column) => column.key));

  if (configuredKeys.size !== config.columns.length) {
    throw new Error("Import column keys must be unique.");
  }

  for (const key of config.duplicateKeys ?? []) {
    if (!configuredKeys.has(key)) {
      throw new Error(`Duplicate key "${key}" is not defined in columns.`);
    }
  }

  return {
    processRows(sourceRows, suppliedMapping) {
      const validRows: T[] = [];
      const invalidRows: ProcessRowsResult<T>["invalidRows"] = [];
      const seen = new Map<string, Set<string>>();

      for (const key of config.duplicateKeys ?? []) {
        seen.set(key, new Set());
      }

      sourceRows.forEach((sourceRow, rowIndex) => {
        const mappedRow: Record<string, unknown> = {};
        const issues: ImportIssue[] = [];
        const sourceHeaders = Object.keys(sourceRow);
        const usedHeaders = new Set<string>();

        for (const column of config.columns) {
          const candidates = suppliedMapping === undefined
            ? sourceHeaders.filter((header) => {
                const normalizedHeader = normalizeHeader(header);
                return normalizedHeader === normalizeHeader(column.label)
                  || normalizedHeader === normalizeHeader(column.key);
              })
            : sourceHeaders.filter((header) => suppliedMapping[header] === column.key);

          const availableCandidates = candidates.filter((header) => !usedHeaders.has(header));

          if (availableCandidates.length > 1) {
            issues.push({
              rowIndex,
              column: column.key,
              value: undefined,
              code: "ambiguous",
              message: `More than one source column maps to "${column.label}".`,
            });
            continue;
          }

          const sourceHeader = availableCandidates[0];
          if (sourceHeader !== undefined) usedHeaders.add(sourceHeader);

          const rawValue = sourceHeader === undefined ? undefined : sourceRow[sourceHeader];
          let value: unknown;

          try {
            value = column.transform
              ? column.transform(rawValue, sourceRow)
              : rawValue;
          } catch (error) {
            issues.push({
              rowIndex,
              column: column.key,
              value: rawValue,
              code: "invalid",
              message: error instanceof Error
                ? `Transformation failed: ${error.message}`
                : "Transformation failed.",
            });
            continue;
          }

          mappedRow[column.key] = value;

          if (column.required && isMissing(value)) {
            issues.push({
              rowIndex,
              column: column.key,
              value,
              code: "required",
              message: `${column.label} is required.`,
            });
            continue;
          }

          try {
            const validationMessage = column.validate?.(value, mappedRow as Partial<T>);
            if (validationMessage) {
              issues.push({
                rowIndex,
                column: column.key,
                value,
                code: "invalid",
                message: validationMessage,
              });
            }
          } catch (error) {
            issues.push({
              rowIndex,
              column: column.key,
              value,
              code: "invalid",
              message: error instanceof Error
                ? `Validation failed: ${error.message}`
                : "Validation failed.",
            });
          }
        }

        // Duplicate values are reserved on first occurrence, even if that row
        // has another validation issue. This prevents a later row from silently
        // becoming the accepted representative of the same key.
        for (const key of config.duplicateKeys ?? []) {
          const value = mappedRow[key];
          if (isMissing(value)) continue;

          const normalizedValue = normalizeDuplicateValue(value);
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
          invalidRows.push({ rowIndex, row: mappedRow as unknown as Partial<T>, issues });
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
