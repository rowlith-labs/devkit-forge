import { useCallback, useMemo, useState } from "react";
import { createImporter } from "@devkit-forge/import-core";
import type { ColumnMapping, RawImportRow } from "@devkit-forge/import-core";
import type { UseDataImporterOptions, UseDataImporterResult } from "./types.js";

export function useDataImporter<T extends object>(
  options: UseDataImporterOptions<T>,
): UseDataImporterResult<T> {
  const { config, initialRows = [], initialMapping = {} } = options;
  const importer = useMemo(() => createImporter<T>(config), [config]);

  const [rows, setRowsState] = useState<RawImportRow[]>(() => [...initialRows]);
  const [mapping, setMappingState] = useState<ColumnMapping<T>>(
    () => ({ ...initialMapping }),
  );
  const [result, setResult] = useState<ReturnType<typeof importer.processRows> | null>(null);

  const setRows = useCallback((nextRows: RawImportRow[]) => {
    setRowsState([...nextRows]);
    setResult(null);
  }, []);

  const setMapping = useCallback((nextMapping: ColumnMapping<T>) => {
    setMappingState({ ...nextMapping });
    setResult(null);
  }, []);

  const process = useCallback(() => {
    const nextResult = importer.processRows(rows, mapping);
    setResult(nextResult);
    return nextResult;
  }, [importer, mapping, rows]);

  const reset = useCallback(() => {
    setRowsState([]);
    setMappingState({ ...initialMapping });
    setResult(null);
  }, [initialMapping]);

  return { rows, mapping, result, setRows, setMapping, process, reset };
}
