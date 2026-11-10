import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packages = [
  "import-core",
  "import-csv",
  "import-react",
  "import-xlsx",
  "import-ui",
];

const output = await mkdtemp(join(tmpdir(), "devkit-forge-pack-"));

try {
  for (const name of packages) {
    const packageDir = `packages/${name}`;
    const before = new Set(await readdir(output));
    const packed = spawnSync("pnpm", [
      "--dir", packageDir,
      "pack",
      "--pack-destination", output,
    ], { encoding: "utf8", stdio: "inherit" });

    if (packed.status !== 0) {
      throw new Error(`pnpm pack failed for @devkit-forge/${name}`);
    }

    const created = (await readdir(output)).filter((file) => !before.has(file) && file.endsWith(".tgz"));
    if (created.length !== 1) {
      throw new Error(`Expected one tarball for @devkit-forge/${name}; found ${created.length}`);
    }

    const tarball = join(output, created[0]);
    const manifestResult = spawnSync("tar", ["-xOf", tarball, "package/package.json"], {
      encoding: "utf8",
    });
    if (manifestResult.status !== 0) {
      throw new Error(`Could not read packed manifest for @devkit-forge/${name}`);
    }

    const manifest = JSON.parse(manifestResult.stdout);
    if (manifest.name !== `@devkit-forge/${name}`) {
      throw new Error(`Unexpected package name in ${created[0]}: ${manifest.name}`);
    }

    const dependencies = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    };
    const unresolvedWorkspaceDependencies = Object.entries(dependencies)
      .filter(([, version]) => typeof version === "string" && version.startsWith("workspace:"));
    if (unresolvedWorkspaceDependencies.length > 0) {
      throw new Error(`Unresolved workspace dependencies in @devkit-forge/${name}: ${JSON.stringify(unresolvedWorkspaceDependencies)}`);
    }

    const entries = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
    if (entries.status !== 0 || !entries.stdout.split("\n").includes("package/dist/index.js")
      || !entries.stdout.split("\n").includes("package/dist/index.d.ts")) {
      throw new Error(`Packed output for @devkit-forge/${name} is missing its runtime or type entry point`);
    }

    process.stdout.write(`Pack check passed: ${manifest.name}@${manifest.version}\n`);
  }
} finally {
  await rm(output, { recursive: true, force: true });
}
