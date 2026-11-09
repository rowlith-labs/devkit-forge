// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDataImporter } from "./use-data-importer.js";
import type { ImportConfig, RawImportRow } from "@devkit-forge/import-core";

interface Contact {
  email: string;
  name: string;
}

const config: ImportConfig<Contact> = {
  columns: [
    { key: "email", label: "Email", required: true },
    { key: "name", label: "Name", required: true },
  ],
  duplicateKeys: ["email"],
};

describe("useDataImporter", () => {
  it("processes rows through the core engine and exposes the result", () => {
    const { result } = renderHook(() => useDataImporter<Contact>({
      config,
      initialRows: [{ Email: "ada@example.com", Name: "Ada" }],
    }));

    let processed: ReturnType<typeof result.current.process> | undefined;
    act(() => {
      processed = result.current.process();
    });

    expect(processed?.validRows).toEqual([
      { email: "ada@example.com", name: "Ada" },
    ]);
    expect(result.current.result?.validCount).toBe(1);
  });

  it("clears a previous result when rows or mapping changes", () => {
    const { result } = renderHook(() => useDataImporter<Contact>({
      config,
      initialRows: [{ Email: "ada@example.com", Name: "Ada" }],
    }));

    act(() => { result.current.process(); });
    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.setRows([{ Email: "grace@example.com", Name: "Grace" }]);
    });
    expect(result.current.result).toBeNull();
    expect(result.current.rows[0]?.Email).toBe("grace@example.com");

    act(() => { result.current.process(); });
    act(() => { result.current.setMapping({ Email: "email", Name: "name" }); });
    expect(result.current.result).toBeNull();
  });

  it("uses explicit mappings and resets to an empty source with the initial mapping", () => {
    const initialMapping = { email_address: "email", full_name: "name" } as const;
    const { result } = renderHook(() => useDataImporter<Contact>({
      config,
      initialRows: [{ email_address: "ada@example.com", full_name: "Ada" }],
      initialMapping,
    }));

    let processed: ReturnType<typeof result.current.process> | undefined;
    act(() => { processed = result.current.process(); });
    expect(processed?.validCount).toBe(1);

    act(() => { result.current.reset(); });
    expect(result.current.rows).toEqual([]);
    expect(result.current.mapping).toEqual(initialMapping);
    expect(result.current.result).toBeNull();
  });

  it("accepts records produced by the CSV adapter without depending on it", () => {
    const rows: RawImportRow[] = [
      { Email: "ada@example.com", Name: "Ada" },
    ];
    const { result } = renderHook(() => useDataImporter<Contact>({
      config,
      initialRows: rows,
    }));

    expect(result.current.rows).toEqual(rows);
  });
});
