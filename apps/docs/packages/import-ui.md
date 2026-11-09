# @devkit-forge/import-ui

Framework-independent browser UI delivered as a native custom element.

## Exports

- `registerImportUI(registry?, tagName?)`: register and return the custom element constructor.
- `ImportUIElement`: element interface with `configure`, `loadFile`, `setRows`, `setMapping`, `validate`, `reset`, and `result`.
- Event detail types: `ImportUILoadedDetail`, `ImportUIValidatedDetail`, and `ImportUIErrorDetail`.

## Dependencies

The package composes `import-core`, `import-csv`, and `import-xlsx`. The parsing adapters remain independently usable; the UI package is optional.
