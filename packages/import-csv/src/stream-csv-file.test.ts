// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { streamCsvFile } from "./stream-csv-file.js";

function createFile(contents: string): File {
  return new File([contents], "test.csv", { type: "text/csv" });
}

describe("streamCsvFile", () => {
  it("streams batches and reports headers without retaining all rows", async () => {
    const batches: Array<{ rows: string[][]; offset: number }> = [];
    const result = await streamCsvFile(
      createFile("name,age\nAda,37\nGrace,85\nLinus,56"),
      {
        chunkSize: 12,
        onRows(rows, rowOffset) {
          batches.push({ rows, offset: rowOffset });
        },
      },
    );

    expect(result.headers).toEqual(["name", "age"]);
    expect(result.rowCount).toBe(3);
    expect(batches.flatMap((batch) => batch.rows)).toEqual([
      ["Ada", "37"],
      ["Grace", "85"],
      ["Linus", "56"],
    ]);
    expect(batches[0]?.offset).toBe(0);
  });

  it("handles header-only and empty files without inventing records", async () => {
    const headerOnly = await streamCsvFile(createFile("name,age"), { onRows() {} });
    expect(headerOnly.headers).toEqual(["name", "age"]);
    expect(headerOnly.rowCount).toBe(0);

    const empty = await streamCsvFile(createFile(""), { onRows() {} });
    expect(empty.headers).toEqual([]);
    expect(empty.rowCount).toBe(0);
  });

  it("reports duplicate headers and row width issues", async () => {
    const result = await streamCsvFile(
      createFile("name,name\nAda,Grace\nOnlyOneCell"),
      { onRows() {} },
    );

    expect(result.issues.some((issue) => issue.code === "duplicate-header")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "row-width")).toBe(true);
    expect(result.hasErrors).toBe(true);
  });

  it("rejects when the consumer callback throws", async () => {
    await expect(
      streamCsvFile(createFile("name,age\nAda,37"), {
        delimiter: ",",
        onRows() {
          throw new Error("consumer failed");
        },
      }),
    ).rejects.toThrow("consumer failed");
  });
});
