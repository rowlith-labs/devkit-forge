import { readFile } from "node:fs/promises";
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

const manifests = new Map();
for (const name of packages) {
  const manifest = JSON.parse(await readFile(`packages/${name}/package.json`, "utf8"));
  manifests.set(manifest.name, manifest);
}

const rootLicense = await readFile("LICENSE", "utf8");
const output = await mkdtemp(join(tmpdir(), "devkit-forge-pack-"));

try {
  for (const name of packages) {
    const packageDir = `packages/${name}`;
    const packageLicense = await readFile(`${packageDir}/LICENSE`, "utf8");
    if (packageLicense !== rootLicense) {
      throw new Error(`License file differs from the repository license in ${packageDir}`);
    }
    const expectedName = `@devkit-forge/${name}`;
    const before = new Set(await readdir(output));
    const packed = spawnSync("pnpm", [
      "--dir", packageDir,
      "pack",
      "--pack-destination", output,
    ], { encoding: "utf8", stdio: "inherit" });

    if (packed.status !== 0) {
      throw new Error(`pnpm pack failed for ${expectedName}`);
    }

    const created = (await readdir(output)).filter((file) => !before.has(file) && file.endsWith(".tgz"));
    if (created.length !== 1) {
      throw new Error(`Expected one tarball for ${expectedName}; found ${created.length}`);
    }

    const tarball = join(output, created[0]);
    const manifestResult = spawnSync("tar", ["-xOf", tarball, "package/package.json"], {
      encoding: "utf8",
    });
    if (manifestResult.status !== 0) {
      throw new Error(`Could not read packed manifest for ${expectedName}`);
    }

    const manifest = JSON.parse(manifestResult.stdout);
    if (manifest.name !== expectedName) {
      throw new Error(`Unexpected package name in ${created[0]}: ${manifest.name}`);
    }
    if (!/^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
      throw new Error(`Invalid semantic version for ${expectedName}: ${manifest.version}`);
    }
    if (manifest.private === true || manifest.license !== "MIT") {
      throw new Error(`${expectedName} must be public and declare the MIT license`);
    }
    if (manifest.engines?.node !== ">=20" || manifest.publishConfig?.access !== "public") {
      throw new Error(`${expectedName} is missing its Node engine or public-scope publishing metadata`);
    }
    if (manifest.repository?.url !== "https://github.com/truerdp/devkit-forge.git"
      || manifest.repository?.directory !== packageDir
      || !manifest.homepage
      || !manifest.bugs?.url) {
      throw new Error(`${expectedName} is missing repository, homepage, or issue-tracker metadata`);
    }
    if (manifest.main !== "./dist/index.js"
      || manifest.types !== "./dist/index.d.ts"
      || manifest.exports?.["."]?.import !== "./dist/index.js"
      || manifest.exports?.["."]?.types !== "./dist/index.d.ts") {
      throw new Error(`${expectedName} has inconsistent runtime/type entry points`);
    }

    const dependencies = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    };
    for (const [dependency, version] of Object.entries(dependencies)) {
      if (typeof version !== "string" || version.startsWith("workspace:")) {
        throw new Error(`Unresolved workspace dependency in ${expectedName}: ${dependency}@${version}`);
      }
      if (manifests.has(dependency) && version !== manifests.get(dependency).version) {
        throw new Error(`Internal dependency mismatch in ${expectedName}: ${dependency}@${version}; expected ${manifests.get(dependency).version}`);
      }
    }

    const entries = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
    const packedEntries = new Set(entries.stdout.split("\n"));
    for (const requiredEntry of [
      "package/dist/index.js",
      "package/dist/index.d.ts",
      "package/README.md",
      "package/LICENSE",
    ]) {
      if (entries.status !== 0 || !packedEntries.has(requiredEntry)) {
        throw new Error(`Packed output for ${expectedName} is missing ${requiredEntry}`);
      }
    }

    process.stdout.write(`Pack check passed: ${manifest.name}@${manifest.version}\n`);
  }
} finally {
  await rm(output, { recursive: true, force: true });
}
