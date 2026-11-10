import { describe, expect, it } from "vitest";
import { createImporter } from "./create-importer.js";

interface Customer {
  email: string;
  name: string;
}

const customerColumns = [
  { key: "email", label: "Email", required: true },
  { key: "name", label: "Full Name", required: true },
] as const;

describe("createImporter", () => {
  it("validates importer configuration and input row shapes", () => {
    expect(() => createImporter<Customer>({ columns: [] })).toThrow(/at least one column/);
    expect(() => createImporter<Customer>({ columns: [{ key: "email", label: " " }] })).toThrow(/non-empty label/);
    const importer = createImporter<Customer>({ columns: [...customerColumns] });
    expect(() => importer.processRows(null as unknown as never)).toThrow(/sourceRows must be an array/);
    expect(() => importer.processRows([null as unknown as never])).toThrow(/non-null record object/);
    expect(() => importer.processRows([{ Email: "x", "Full Name": "A" }], null as unknown as never)).toThrow(/mapping must be an object/);
  });

  it("maps rows and reports required, invalid, and duplicate values", () => {
    const importer = createImporter<Customer>({
      columns: [
        {
          key: "email",
          label: "Email",
          required: true,
          validate: (value) => typeof value === "string" && value.includes("@")
            ? undefined
            : "Enter a valid email.",
        },
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

  it("supports explicit source-to-schema mapping without guessing unmapped headers", () => {
    const importer = createImporter<Customer>({ columns: [...customerColumns] });
    const result = importer.processRows(
      [{ contact: "a@example.com", customer: "Ada", Email: "wrong@example.com" }],
      { contact: "email", customer: "name" },
    );

    expect(result.validRows).toEqual([{ email: "a@example.com", name: "Ada" }]);
  });

  it("validates explicit mapping targets and ignores inherited mapping properties", () => {
    const importer = createImporter<Customer>({ columns: [...customerColumns] });

    expect(() => importer.processRows(
      [{ contact: "a@example.com", customer: "Ada" }],
      { contact: "not-a-schema-key" } as never,
    )).toThrow(/unknown schema key/);

    const inheritedMapping = Object.assign(
      Object.create({ contact: "email" }) as Record<string, keyof Customer>,
      { customer: "name" },
    );
    const result = importer.processRows(
      [{ contact: "a@example.com", customer: "Ada" }],
      inheritedMapping,
    );

    expect(result.validCount).toBe(0);
    expect(result.invalidRows[0]?.issues.some((issue) => issue.code === "required")).toBe(true);
  });

  it("treats whitespace-only required values as missing", () => {
    const importer = createImporter<Customer>({ columns: [...customerColumns] });
    const result = importer.processRows([{ Email: "  ", "Full Name": "Ada" }]);

    expect(result.invalidRows[0]?.issues[0]?.code).toBe("required");
  });

  it("reports ambiguous automatic header matches", () => {
    const importer = createImporter<Customer>({
      columns: [{ key: "email", label: "Email", required: true }, customerColumns[1]],
    });
    const result = importer.processRows([
      { Email: "a@example.com", email: "b@example.com", "Full Name": "Ada" },
    ]);

    expect(result.invalidRows[0]?.issues[0]?.code).toBe("ambiguous");
  });

  it("captures transformation and validation exceptions as row issues", () => {
    const importer = createImporter<Customer>({
      columns: [
        { key: "email", label: "Email", transform: () => { throw new Error("bad transform"); } },
        { key: "name", label: "Name", validate: () => { throw new Error("bad validator"); } },
      ],
    });
    const result = importer.processRows([{ Email: "a@example.com", Name: "Ada" }]);

    expect(result.invalidCount).toBe(1);
    expect(result.invalidRows[0]?.issues).toHaveLength(2);
  });

  it("preserves schema fields named __proto__ as ordinary own properties", () => {
    type PrototypeKey = { ["__proto__"]: string };
    const importer = createImporter<PrototypeKey>({
      columns: [{ key: "__proto__", label: "Prototype value", required: true }],
    });
    const source = { ["Prototype value"]: "safe" };
    const result = importer.processRows([source]);

    expect(result.validRows).toHaveLength(1);
    expect(Object.hasOwn(result.validRows[0]!, "__proto__")).toBe(true);
    expect(result.validRows[0]!["__proto__"]).toBe("safe");
    expect(Object.getPrototypeOf(result.validRows[0]!)).toBe(Object.prototype);
  });

  it("rejects duplicate schema keys and unknown duplicate keys", () => {
    expect(() => createImporter<Customer>({
      columns: [
        { key: "email", label: "Email" },
        { key: "email", label: "Email again" },
      ],
    })).toThrow("Import column keys must be unique.");

    expect(() => createImporter<Customer>({
      columns: [...customerColumns],
      duplicateKeys: ["missing" as keyof Customer & string],
    })).toThrow('Duplicate key "missing" is not defined in columns.');
  });
});
