import ExcelJS from "exceljs-hardened";
import { describe, expect, it } from "vitest";
import { parseXlsxFile } from "./parse-xlsx-file.js";

async function makeWorkbook(): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Contacts");
  sheet.addRow(["Name", "Email", "Joined"]);
  sheet.addRow(["Ada", "ada@example.com", new Date("2024-01-02T00:00:00.000Z")]);
  sheet.addRow(["Grace", "grace@example.com", null]);
  const other = workbook.addWorksheet("Other");
  other.addRow(["Code"]);
  other.addRow([42]);
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

describe("parseXlsxFile", () => {
  it("reads the first sheet, typed cell values, and object records", async () => {
    const result = await parseXlsxFile(await makeWorkbook());

    expect(result.sheetNames).toEqual(["Contacts", "Other"]);
    expect(result.selectedSheet).toBe("Contacts");
    expect(result.headers).toEqual(["Name", "Email", "Joined"]);
    expect(result.records).toHaveLength(2);
    expect(result.records?.[0]?.Name).toBe("Ada");
    expect(result.records?.[0]?.Joined).toBeInstanceOf(Date);
    expect(result.rowCount).toBe(2);
    expect(result.issues).toEqual([]);
  });

  it("selects a sheet by name or zero-based index", async () => {
    const bytes = await makeWorkbook();
    expect((await parseXlsxFile(bytes, { sheet: "Other" })).records?.[0]?.Code).toBe(42);
    expect((await parseXlsxFile(bytes, { sheet: 1 })).selectedSheet).toBe("Other");
  });

  it("reports missing sheets without throwing", async () => {
    const result = await parseXlsxFile(await makeWorkbook(), { sheet: "Missing" });
    expect(result.sheetNames).toEqual(["Contacts", "Other"]);
    expect(result.selectedSheet).toBeNull();
    expect(result.issues[0]?.code).toBe("workbook-error");
  });

  it("preserves duplicate and empty headers but withholds object records", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bad headers");
    sheet.addRow(["Name", "Name", ""]);
    sheet.addRow(["Ada", "Grace", "Unknown"]);
    const result = await parseXlsxFile(new Uint8Array(await workbook.xlsx.writeBuffer()));

    expect(result.headers).toEqual(["Name", "Name", ""]);
    expect(result.records).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toEqual(["duplicate-header", "empty-header"]);
    expect(result.data[0]).toEqual(["Ada", "Grace", "Unknown"]);
  });

  it("applies formula policies without evaluating formulas", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Formulas");
    sheet.addRow(["Cached", "Formula"]);
    sheet.getCell("A2").value = { formula: "1+1", result: 2 };
    sheet.getCell("B2").value = { formula: "1+1" };
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());

    const cached = await parseXlsxFile(bytes);
    expect(cached.data[0]).toEqual([2, ""]);
    expect(cached.issues.some((issue) => issue.code === "formula-no-cache")).toBe(true);

    const formulaText = await parseXlsxFile(bytes, { formulaPolicy: "formula-text" });
    expect(formulaText.data[0]).toEqual(["=1+1", "=1+1"]);

    const rejected = await parseXlsxFile(bytes, { formulaPolicy: "reject" });
    expect(rejected.data[0]).toEqual(["", ""]);
    expect(rejected.issues.filter((issue) => issue.code === "formula-rejected")).toHaveLength(2);
  });

  it("supports a one-based header row and preserves cells beyond the header width", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Offsets");
    sheet.addRow(["Workbook title"]);
    sheet.addRow(["Name", "Email"]);
    sheet.addRow(["Ada", "ada@example.com", "unexpected"]);
    sheet.addRow(["Grace"]);
    const result = await parseXlsxFile(new Uint8Array(await workbook.xlsx.writeBuffer()), { headerRow: 2 });

    expect(result.headers).toEqual(["Name", "Email"]);
    expect(result.data[0]).toEqual(["Ada", "ada@example.com", "unexpected"]);
    expect(result.data[1]).toEqual(["Grace", "", ""]);
    expect(result.issues.filter((issue) => issue.code === "row-width").map((issue) => issue.rowIndex)).toEqual([0, 1]);
  });

  it("caps retained diagnostics and reports the total", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Many issues");
    sheet.addRow(["Name", "Name", "Name"]);
    sheet.addRow(["Ada", "Grace", "Katherine"]);
    const result = await parseXlsxFile(new Uint8Array(await workbook.xlsx.writeBuffer()), { maxIssues: 1 });

    expect(result.totalIssueCount).toBe(2);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[1]?.code).toBe("issues-truncated");
    expect(result.issuesTruncated).toBe(true);
  });

  it("rejects corrupt workbook data", async () => {
    await expect(parseXlsxFile(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  });

  it("skips blank rows by default and can preserve them", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rows");
    sheet.addRow(["Name"]);
    sheet.addRow(["Ada"]);
    sheet.addRow([]);
    sheet.addRow(["Grace"]);
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());

    expect((await parseXlsxFile(bytes)).data).toEqual([["Ada"], ["Grace"]]);
    expect((await parseXlsxFile(bytes, { emptyRows: "preserve" })).data).toEqual([["Ada"], [""], ["Grace"]]);
  });

  it("enforces file-size and row limits", async () => {
    const bytes = await makeWorkbook();
    const tooLarge = await parseXlsxFile(bytes, { maxFileSizeBytes: 10 });
    expect(tooLarge.issues[0]?.code).toBe("file-too-large");

    await expect(parseXlsxFile(bytes, { maxTotalUncompressedSize: 1 })).rejects.toThrow(/uncompressed size/i);

    const rowLimited = await parseXlsxFile(bytes, { maxRows: 1 });
    expect(rowLimited.rowCount).toBe(1);
    expect(rowLimited.issues.some((issue) => issue.code === "row-limit")).toBe(true);
  });

  it("rejects invalid numeric limits", async () => {
    const bytes = await makeWorkbook();
    await expect(parseXlsxFile(bytes, { maxRows: 0 })).rejects.toThrow(RangeError);
    await expect(parseXlsxFile(bytes, { maxIssues: 1.5 })).rejects.toThrow(RangeError);
    await expect(parseXlsxFile(bytes, { headerRow: Number.MAX_SAFE_INTEGER + 1 })).rejects.toThrow(RangeError);
    await expect(parseXlsxFile(bytes, { maxTotalUncompressedSize: 0 })).rejects.toThrow(RangeError);
  });

  it("preserves __proto__ as an own header property", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Prototype");
    sheet.addRow(["__proto__", "Name"]);
    sheet.addRow(["safe", "Ada"]);
    const result = await parseXlsxFile(new Uint8Array(await workbook.xlsx.writeBuffer()));

    expect(Object.hasOwn(result.records![0]!, "__proto__")).toBe(true);
    expect(result.records![0]?.["__proto__"]).toBe("safe");
  });

  it("accepts browser Blob input", async () => {
    const bytes = await makeWorkbook();
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const result = await parseXlsxFile(blob);
    expect(result.records?.[0]?.Name).toBe("Ada");
  });
});
