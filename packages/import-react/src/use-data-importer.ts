import { useCallback, useMemo, useState } from "react";
import { createImporter } from "@devkit-forge/import-core";
import type { ColumnMapping, RawImportRow } from "@devkit-forge/import-core";
import type { UseDataImporterOptions, UseDataImporterResult } from "./types.js";

export function useDataImporter<T extends object>(
  options: UseDataImporterOptions<T>,
): UseDataImporterResult<T> {
  const { config, initialRows = [], initialMapping } = options;
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
    setRowsState([...nextRows]);
    setResult(null);
  }, []);

  const setMapping = useCallback((nextMapping: ColumnMapping<T>) => {
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
