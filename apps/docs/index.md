---
layout: home
hero:
  name: DevKit Forge
  text: Reliable data imports, built for developers.
  tagline: Small, composable TypeScript tools for parsing, mapping, validating, and reviewing imported data.
  actions:
    - theme: brand
      text: Get started
      link: /guide/quick-start
    - theme: alt
      text: Explore packages
      link: /packages/import-core
    - theme: alt
      text: Open playground
      link: https://github.com/yourdevujjawal/devkit-forge/tree/main/apps/playground
  image:
    src: /devkit-mark.svg
    alt: DevKit Forge mark
features:
  - title: Framework-independent core
    details: Define a schema once and validate plain JavaScript records without tying business logic to a UI framework.
  - title: Composable adapters
    details: Add CSV parsing or React state management only when your application needs them.
  - title: Actionable row errors
    details: Return valid records separately from invalid rows, with field-level issue codes and messages.
  - title: Local-first processing
    details: Parse and validate files in your own application. DevKit Forge does not require a hosted import service.
  - title: Explicit mapping rules
    details: Use automatic normalized header matching or provide an authoritative source-to-schema mapping.
  - title: TypeScript-first
    details: Keep destination record shapes and configuration typed from schema definition to result handling.
---

## Start with the layer you need

<div class="package-grid">
  <a class="package-card" href="./packages/import-core">
    <span class="package-tag">FOUNDATION</span>
    <h3>@devkit-forge/import-core</h3>
    <p>Map source records to a schema, validate values, detect duplicates, and inspect row-level issues.</p>
    <span>Explore core →</span>
  </a>
  <a class="package-card" href="./packages/import-csv">
    <span class="package-tag">CSV ADAPTER</span>
    <h3>@devkit-forge/import-csv</h3>
    <p>Parse CSV text and browser files, preserve header diagnostics, or stream large files in batches.</p>
    <span>Explore CSV →</span>
  </a>
  <a class="package-card" href="./packages/import-react">
    <span class="package-tag">REACT ADAPTER</span>
    <h3>@devkit-forge/import-react</h3>
    <p>Keep rows, mappings, and validation results in React state with a headless hook.</p>
    <span>Explore React →</span>
  </a>
  <a class="package-card" href="./packages/import-xlsx">
    <span class="package-tag">XLSX ADAPTER</span>
    <h3>@devkit-forge/import-xlsx</h3>
    <p>Read worksheets, typed cell values, and configurable header rows with explicit workbook limits.</p>
    <span>Explore XLSX →</span>
  </a>
  <a class="package-card" href="./packages/import-ui">
    <span class="package-tag">WEB COMPONENT</span>
    <h3>@devkit-forge/import-ui</h3>
    <p>Add a framework-independent browser import interface with Shadow DOM encapsulation.</p>
    <span>Explore UI →</span>
  </a>
</div>

## Try a working example

Run the [Vite + React example](/guide/examples) locally to parse a CSV, validate records, and review row-level issues. Or explore the [browser playground](https://github.com/yourdevujjawal/devkit-forge/tree/main/apps/playground).

## A small, predictable workflow

1. Define the destination schema and its validation rules.
2. Parse a source file with the adapter that fits your format.
3. Map and validate the resulting records.
4. Review invalid rows and decide how your application should handle valid data.

DevKit Forge does not submit records to your backend. Persistence, user consent, and import execution remain under your application's control.
