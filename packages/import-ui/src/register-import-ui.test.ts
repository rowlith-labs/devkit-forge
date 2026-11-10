import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerImportUI } from "./register-import-ui.js";
import type { ImportUIElement } from "./types.js";

interface Contact {
  name: string;
  email: string;
}

describe("registerImportUI", () => {
  let element: ImportUIElement;

  beforeEach(() => {
    const tag = `df-test-${Math.random().toString(36).slice(2)}`;
    registerImportUI(customElements, tag);
    element = document.createElement(tag) as ImportUIElement;
    document.body.append(element);
    element.configure<Contact>({
      columns: [
        { key: "name", label: "Full name", required: true },
        { key: "email", label: "Email", required: true },
      ],
      duplicateKeys: ["email"],
    });
  });

  afterEach(() => {
    element.remove();
  });

  it("registers a valid custom element tag and rejects invalid names", () => {
    expect(() => registerImportUI(customElements, "invalid")).toThrow(TypeError);
    expect(registerImportUI(customElements, "df-repeat")).toBe(
      registerImportUI(customElements, "df-repeat"),
    );
  });

  it("automatically maps, validates rows, and emits a typed result event", () => {
    const listener = vi.fn();
    element.addEventListener("df:validated", listener);
    element.setRows([
      { "Full name": "Ada Lovelace", Email: "ada@example.com" },
      { "Full name": "", Email: "bad@example.com" },
      { "Full name": "Grace Hopper", Email: "ada@example.com" },
    ]);

    const result = element.validate();

    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(2);
    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail.result).toBe(result);
    expect(element.shadowRoot?.querySelector("[data-status]")?.textContent)
      .toContain("1 valid, 2 invalid");
  });

  it("uses core header normalization and does not duplicate listeners after reconnect", () => {
    const listener = vi.fn();
    element.addEventListener("df:validated", listener);
    element.remove();
    document.body.append(element);
    element.setRows([{ "Full-name": "Ada", Email: "ada@example.com" }]);
    expect(element.validate().validCount).toBe(1);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("supports explicit mappings and reset", () => {
    element.setRows([{ contact: "ada@example.com", customer: "Ada" }]);
    element.setMapping({ contact: "email", customer: "name" });

    expect(element.validate().validRows).toEqual([
      { email: "ada@example.com", name: "Ada" },
    ]);

    element.reset();
    expect(element.result).toBeNull();
    expect(element.shadowRoot?.querySelector("[data-validate]")?.hasAttribute("disabled"))
      .toBe(true);
  });

  it("renders imported values as text rather than interpreting HTML", () => {
    element.setRows([{
      "Full name": '<img src=x onerror="alert(1)">',
      Email: "ada@example.com",
    }]);
    element.validate();

    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.querySelector("tbody td")?.textContent)
      .toBe('<img src=x onerror="alert(1)">');
  });

  it("ignores stale file-read results after reset", async () => {
    const pending = new Promise<string>((resolve) => {
      void resolve;
    });
    const file = new File(["name,email\\nAda,ada@example.com"], "contacts.csv", { type: "text/csv" });
    const textSpy = vi.spyOn(file, "text").mockReturnValue(pending);
    const loaded = vi.fn();
    element.addEventListener("df:loaded", loaded);

    const loading = element.loadFile(file);
    element.reset();
    textSpy.mockRestore();
    await loading;

    expect(element.result).toBeNull();
    expect(loaded).not.toHaveBeenCalled();
  });

  it("requires configuration and rows before validation", () => {
    const bareTag = `df-empty-${Math.random().toString(36).slice(2)}`;
    registerImportUI(customElements, bareTag);
    const bare = document.createElement(bareTag) as ImportUIElement;
    expect(() => bare.validate()).toThrow(/configure/);
    bare.configure<Contact>({ columns: [{ key: "name", label: "Name" }] });
    expect(() => bare.validate()).toThrow(/Load a file/);
  });
});