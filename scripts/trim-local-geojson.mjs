#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CAMPUS_BOUNDS,
  filterFeatureCollectionByBounds,
} from "./lib/geojson-utils.mjs";

const JSON_ROOT = join(process.cwd(), "src/server/data/json");

async function gatherGeoJsonFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(root, entry.name);
      if (entry.isDirectory()) {
        return gatherGeoJsonFiles(fullPath);
      }
      if (entry.isFile() && entry.name.endsWith(".geojson")) {
        return [fullPath];
      }
      return [];
    }),
  );

  return files.flat();
}

async function trimFile(filePath) {
  const original = await readFile(filePath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(original);
  } catch (error) {
    console.warn(`Skipping ${filePath}: failed to parse JSON.`);
    return;
  }

  if (
    !parsed ||
    parsed.type !== "FeatureCollection" ||
    !Array.isArray(parsed.features)
  ) {
    return;
  }

  const before = parsed.features.length;
  const trimmed = filterFeatureCollectionByBounds(parsed, CAMPUS_BOUNDS);
  const after = trimmed.features.length;

  if (after === before) {
    return;
  }

  await writeFile(filePath, `${JSON.stringify(trimmed, null, 2)}\n`, "utf-8");
  console.log(
    `Trimmed ${before - after} feature(s) from ${filePath} (now ${after})`,
  );
}

async function main() {
  try {
    const rootStats = await stat(JSON_ROOT);
    if (!rootStats.isDirectory()) {
      console.error(
        `Expected directory at ${JSON_ROOT}, but found something else.`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `Unable to read ${JSON_ROOT}. Has the dataset been downloaded yet?`,
    );
    process.exit(1);
  }

  const files = await gatherGeoJsonFiles(JSON_ROOT);
  if (files.length === 0) {
    console.log("No GeoJSON files found to trim.");
    return;
  }

  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    await trimFile(file);
  }
}

main().catch((error) => {
  console.error("Failed to trim GeoJSON files.");
  console.error(error);
  process.exit(1);
});
