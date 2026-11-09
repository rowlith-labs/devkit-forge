import { describe, expect, it } from "vitest";
import { normalizeHeader } from "./normalize-headers.js";

describe("normalizeHeader", () => {
  it("normalizes whitespace, punctuation, and case", () => {
    expect(normalizeHeader(" First Name ")).toBe("first_name");
    expect(normalizeHeader("E-mail Address")).toBe("e_mail_address");
  });

  it("removes common diacritics", () => {
    expect(normalizeHeader("Café")).toBe("cafe");
  });
});
