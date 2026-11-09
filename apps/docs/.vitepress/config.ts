import { defineConfig } from "vitepress";

export default defineConfig({
  title: "DevKit Forge",
  description: "TypeScript-first tools for reliable data import workflows.",
  cleanUrls: true,
  themeConfig: {
    siteTitle: "DevKit Forge",
    nav: [
      { text: "Guide", link: "/guide/what-is-devkit-forge" },
      { text: "Packages", link: "/packages/import-core" },
      { text: "Playground", link: "https://github.com/truerdp/devkit-forge/tree/main/apps/playground" },
      { text: "GitHub", link: "https://github.com/truerdp/devkit-forge" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting started",
          items: [
            { text: "What is DevKit Forge?", link: "/guide/what-is-devkit-forge" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick start", link: "/guide/quick-start" },
            { text: "Architecture", link: "/guide/architecture" },
          ],
        },
        {
          text: "Guides",
          items: [
            { text: "CSV imports", link: "/guide/csv-imports" },\n            { text: "XLSX imports", link: "/guide/xlsx-imports" },
            { text: "Validation and mapping", link: "/guide/validation-and-mapping" },
            { text: "Large files", link: "/guide/large-files" },
            { text: "Quality and security", link: "/guide/quality-and-security" },
            { text: "Troubleshooting", link: "/guide/troubleshooting" },
          ],
        },
      ],
      "/packages/": [
        {
          text: "Packages",
          items: [
            { text: "import-core", link: "/packages/import-core" },
            { text: "import-csv", link: "/packages/import-csv" },\n            { text: "import-xlsx", link: "/packages/import-xlsx" },
            { text: "import-react", link: "/packages/import-react" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/truerdp/devkit-forge" },
    ],
    footer: {
      message: "Open source under the MIT License.",
      copyright: "Copyright © DevKit Forge contributors",
    },
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/truerdp/devkit-forge/edit/main/apps/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
