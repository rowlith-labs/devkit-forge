import { describe, expect, it } from "vitest";
import { createImporter } from "./create-importer.js";

interface Customer {
  email: string;
  name: string;
}

describe("createImporter", () => {
  it("maps rows and reports required, invalid, and duplicate values", () => {
    const importer = createImporter<Customer>({
      columns: [
        { key: "email", label: "Email", required: true, validate: (value) =>
          typeof value === "string" && value.includes("@") ? undefined : "Enter a valid email." },
        { key: "name", label: "Full Name", required: true },
      ],
      duplicateKeys: ["email"],
    });

    const result = importer.processRows([
      { Email: "a@example.com", "Full Name": "A" },
      { Email: "a@example.com", "Full Name": "B" },
      { Email: "", "Full Name": "C" },
    ]);

    expect(result.totalRows).toBe(3);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(2);
    expect(result.invalidRows[0]?.issues[0]?.code).toBe("duplicate");
    expect(result.invalidRows[1]?.issues[0]?.code).toBe("required");
  });

  it("supports explicit source-to-schema mapping", () => {
    const importer = createImporter<Customer>({
      columns: [
        { key: "email", label: "Email", required: true },
        { key: "name", label: "Name", required: true },
      ],
    });

    const result = importer.processRows(
      [{ contact: "a@example.com", customer: "Ada" }],
      { contact: "email", customer: "name" },
    );

    expect(result.validRows).toEqual([{ email: "a@example.com", name: "Ada" }]);
  });
});
