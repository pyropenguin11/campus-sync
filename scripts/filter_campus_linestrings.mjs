#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TARGET_FILES = [
  "EAST_BANK.geojson",
  "WEST_BANK.geojson",
  "ST_PAUL.geojson",
];
const JSON_ROOT = join(process.cwd(), "src/server/data/json");
const ALLOWED_TYPES = new Set(["linestring", "multilinestring"]);

function isLineGeometry(geometry) {
  if (!geometry || typeof geometry.type !== "string") {
    return false;
  }
  return ALLOWED_TYPES.has(geometry.type.toLowerCase());
}

async function filterLineFeatures(fileName) {
  const filePath = join(JSON_ROOT, fileName);
  let parsed;

  try {
    const raw = await readFile(filePath, "utf-8");
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read or parse ${filePath}:`, error.message);
    return;
  }

  if (
    !parsed ||
    parsed.type !== "FeatureCollection" ||
    !Array.isArray(parsed.features)
  ) {
    console.warn(`Skipping ${filePath}: not a valid FeatureCollection.`);
    return;
  }

  const originalCount = parsed.features.length;
  const filteredFeatures = parsed.features.filter((feature) =>
    isLineGeometry(feature?.geometry),
  );
  const removed = originalCount - filteredFeatures.length;

  if (removed === 0) {
    console.log(`No changes needed for ${fileName}.`);
    return;
  }

  const updated = {
    ...parsed,
    features: filteredFeatures,
  };

  await writeFile(
    filePath,
    `${JSON.stringify(updated, null, 2)}\n`,
    "utf-8",
  );
  console.log(
    `Removed ${removed} feature(s) from ${fileName} (remaining ${filteredFeatures.length}).`,
  );
}

async function main() {
  await Promise.all(TARGET_FILES.map((file) => filterLineFeatures(file)));
}

main().catch((error) => {
  console.error("Failed to filter GeoJSON files.");
  console.error(error);
  process.exit(1);
});
