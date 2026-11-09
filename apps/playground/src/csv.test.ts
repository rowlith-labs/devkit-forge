import { describe, expect, it } from "vitest";
import { serializeCsv } from "./csv.js";

describe("serializeCsv", () => {
  it("quotes delimiters, quotes, and line breaks", () => {
    expect(serializeCsv(["name", "note"], [["Ada", 'hello, "world"\\nnext']]))
      .toBe('name,note\\r\\nAda,"hello, ""world""\\nnext"');
  });

  it.each(["=1+1", "+SUM(A1:A2)", "-1+2", "@HYPERLINK(1)", "  =1+1", "\\t=1+1"])(
    "neutralizes spreadsheet formula prefix %s",
    (value) => {
      expect(serializeCsv(["value"], [[value]])).toBe(`value\\r\\n'${value}`);
    },
  );

  it("preserves ordinary text and empty values", () => {
    expect(serializeCsv(["value"], [["hello"], [null], [42]])).toBe("value\\r\\nhello\\r\\n\\r\\n42");
  });
});
