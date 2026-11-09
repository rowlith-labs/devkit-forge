import { describe, expect, it } from "vitest";
import { parseCsvText } from "./parse-csv.js";

describe("parseCsvText", () => {
  it("parses records and trims headers", () => {
    const result = parseCsvText(" Name ,Email\nAda,ada@example.com");
    expect(result.headers).toEqual(["Name", "Email"]);
    expect(result.records).toEqual([{ Name: "Ada", Email: "ada@example.com" }]);
    expect(result.issues).toEqual([]);
  });

  it("supports quoted delimiters and embedded newlines", () => {
    const result = parseCsvText('name,note\nAda,"hello, world"\nGrace,"line one\nline two"');
    expect(result.records).toEqual([
      { name: "Ada", note: "hello, world" },
      { name: "Grace", note: "line one\nline two" },
    ]);
  });

  it("detects delimiters when none is supplied", () => {
    const result = parseCsvText("name;age\nAda;37");
    expect(result.delimiter).toBe(";");
    expect(result.records).toEqual([{ name: "Ada", age: "37" }]);
  });

  it("preserves duplicate headers without creating lossy records", () => {
    const result = parseCsvText("name,name\nAda,Grace");
    expect(result.headers).toEqual(["name", "name"]);
    expect(result.data).toEqual([["Ada", "Grace"]]);
    expect(result.records).toBeNull();
    expect(result.issues.some((issue) => issue.code === "duplicate-header")).toBe(true);
  });

  it("reports empty headers", () => {
    const result = parseCsvText("name,\nAda,Grace");
    expect(result.records).toBeNull();
    expect(result.issues.some((issue) => issue.code === "empty-header")).toBe(true);
  });

  it("ignores blank lines by default", () => {
    const result = parseCsvText("name,age\n\nAda,37\n  \n");
    expect(result.rowCount).toBe(1);
  });

  it("preserves a __proto__ header as an own data property", () => {
    const result = parseCsvText("__proto__,name\nsafe,Ada");

    expect(result.records).toHaveLength(1);
    expect(Object.hasOwn(result.records![0]!, "__proto__")).toBe(true);
    expect(result.records![0]!["__proto__"]).toBe("safe");
    expect(Object.getPrototypeOf(result.records![0]!)).toBe(Object.prototype);
  });

  it("allows an explicit delimiter", () => {
    const result = parseCsvText("name|age\nAda|37", { delimiter: "|" });
    expect(result.delimiter).toBe("|");
    expect(result.records).toEqual([{ name: "Ada", age: "37" }]);
  });
});
