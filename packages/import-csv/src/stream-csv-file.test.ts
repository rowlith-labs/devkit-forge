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
  it("preserves row offsets across small chunks and quoted newlines", async () => {
    const batches: Array<{ rows: string[][]; offset: number }> = [];
    const csv = [
      "name,note",
      'Ada,"line one\nline two"',
      "Grace,works",
      "Linus,ok",
    ].join("\n");

    const result = await streamCsvFile(createFile(csv), {
      chunkSize: 7,
      onRows(rows, offset) {
        batches.push({ rows, offset });
      },
    });

    expect(result.rowCount).toBe(3);
    expect(batches.flatMap((batch) => batch.rows)).toEqual([
      ["Ada", "line one\nline two"],
      ["Grace", "works"],
      ["Linus", "ok"],
    ]);

    let expectedOffset = 0;
    for (const batch of batches) {
      expect(batch.offset).toBe(expectedOffset);
      expectedOffset += batch.rows.length;
    }
    expect(expectedOffset).toBe(3);
  });

  it("reports row-width issues with data-row indexes across chunks", async () => {
    const result = await streamCsvFile(
      createFile("name,age\nAda,37\nGrace\nLinus,56"),
      { chunkSize: 8, onRows() {} },
    );

    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "row-width",
      rowIndex: 1,
    }));
  });

  it("offsets parser errors to zero-based data-row indexes across chunks", async () => {
    const result = await streamCsvFile(
      createFile('name,note\nAda,ok\nGrace,"unterminated'),
      { chunkSize: 8, onRows() {} },
    );

    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "parser-error",
      rowIndex: 1,
    }));
  });

  it("stops parsing after the consumer callback fails", async () => {
    let calls = 0;
    await expect(
      streamCsvFile(
        createFile("name\nAda\nGrace\nLinus"),
        {
          chunkSize: 5,
          onRows() {
            calls += 1;
            throw new Error("stop now");
          },
        },
      ),
    ).rejects.toThrow("stop now");
    expect(calls).toBe(1);
  });

  it("bounds retained diagnostics while preserving the total count", async () => {
    const result = await streamCsvFile(
      createFile("name,name\nAda\nGrace"),
      { maxIssues: 2, onRows() {} },
    );

    expect(result.issues).toHaveLength(2);
    expect(result.issues[1]?.code).toBe("issues-truncated");
    expect(result.totalIssueCount).toBe(4);
    expect(result.issuesTruncated).toBe(true);
    expect(result.hasErrors).toBe(true);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid max issue count %s",
    async (maxIssues) => {
      await expect(
        streamCsvFile(createFile("name\nAda"), { maxIssues, onRows() {} }),
      ).rejects.toThrow("maxIssues must be a positive safe integer");
    },
  );

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid chunk size %s",
    async (chunkSize) => {
      await expect(
        streamCsvFile(createFile("name\nAda"), { chunkSize, onRows() {} }),
      ).rejects.toThrow("chunkSize must be a positive safe integer");
    },
  );

});
