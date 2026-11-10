import { useCallback, useMemo, useState } from "react";
import { createImporter } from "@devkit-forge/import-core";
import type { ColumnMapping, RawImportRow } from "@devkit-forge/import-core";
import type { UseDataImporterOptions, UseDataImporterResult } from "./types.js";

function assertRows(rows: unknown): asserts rows is RawImportRow[] {
  if (!Array.isArray(rows)) {
    throw new TypeError("rows must be an array of record objects.");
  }
  if (rows.some((row) => row === null || typeof row !== "object" || Array.isArray(row))) {
    throw new TypeError("Every row must be a non-null record object.");
  }
}

function assertMapping<T extends object>(
  mapping: unknown,
): asserts mapping is ColumnMapping<T> {
  if (mapping === null || typeof mapping !== "object" || Array.isArray(mapping)) {
    throw new TypeError("mapping must be an object mapping source headers to schema keys.");
  }
}

export function useDataImporter<T extends object>(
  options: UseDataImporterOptions<T>,
): UseDataImporterResult<T> {
  const { config, initialRows = [], initialMapping } = options;
  assertRows(initialRows);
  if (initialMapping !== undefined) assertMapping<T>(initialMapping);
  const importer = useMemo(() => createImporter<T>(config), [config]);

  const [rows, setRowsState] = useState<RawImportRow[]>(() => [...initialRows]);
  const [mapping, setMappingState] = useState<ColumnMapping<T>>(
    () => ({ ...initialMapping }),
  );
  // An omitted mapping means "auto-detect" to the core engine. Keep that
  // distinction even though the hook exposes an empty object to consumers.
  const [hasExplicitMapping, setHasExplicitMapping] = useState(
    () => initialMapping !== undefined,
  );
  const [result, setResult] = useState<ReturnType<typeof importer.processRows> | null>(null);

  const setRows = useCallback((nextRows: RawImportRow[]) => {
    assertRows(nextRows);
    setRowsState([...nextRows]);
    setResult(null);
  }, []);

  const setMapping = useCallback((nextMapping: ColumnMapping<T>) => {
    assertMapping<T>(nextMapping);
    setMappingState({ ...nextMapping });
    setHasExplicitMapping(true);
    setResult(null);
  }, []);

  const process = useCallback(() => {
    const nextResult = importer.processRows(
      rows,
      hasExplicitMapping ? mapping : undefined,
    );
    setResult(nextResult);
    return nextResult;
  }, [importer, mapping, hasExplicitMapping, rows]);

  const reset = useCallback(() => {
    setRowsState([]);
    setMappingState({ ...initialMapping });
    setHasExplicitMapping(initialMapping !== undefined);
    setResult(null);
  }, [initialMapping]);

  return { rows, mapping, result, setRows, setMapping, process, reset };
}
