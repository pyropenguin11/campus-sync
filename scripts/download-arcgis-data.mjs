#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  CAMPUS_BOUNDS,
  filterFeatureCollectionByBounds,
} from "./lib/geojson-utils.mjs";

const SERVICE_BASE =
  "https://services1.arcgis.com/NEfPUcqTuMvqwoCp/arcgis/rest/services";
const DEFAULT_FEATURE_LIST = "src/server/data/arcgis-features.txt";
const OUTPUT_BASE = "src/server/data/json";

/**
 * Primitive CLI option parsing. Supports optional overrides:
 *   --features-file <path>
 *   --feature <name> (may be repeated to only download specific services)
 *   --help
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const filters = [];
  let featureFile = DEFAULT_FEATURE_LIST;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) {
      continue;
    }
    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else if (token === "--features-file") {
      const next = args[index + 1];
      if (!next) {
        console.error("--features-file requires a path argument.");
        process.exit(1);
      }
      featureFile = next;
      index += 1;
    } else if (token === "--feature" || token === "-f") {
      const next = args[index + 1];
      if (!next) {
        console.error(`${token} requires a feature name.`);
        process.exit(1);
      }
      filters.push(next);
      index += 1;
    } else {
      console.error(`Unrecognised argument "${token}".`);
      printHelp();
      process.exit(1);
    }
  }

  return { featureFile, filters };
}

function printHelp() {
  console.log("ArcGIS downloader");
  console.log(
    "Usage: node scripts/download-arcgis-data.mjs [--features-file path] [--feature name]",
  );
  console.log("Defaults to reading feature names from src/server/data/arcgis-features.txt.");
}

async function readFeatureNames(featureFile, filters) {
  const absolutePath = resolve(process.cwd(), featureFile);
  const raw = await readFile(absolutePath, "utf-8");
  const all = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (filters.length === 0) {
    return all;
  }

  const availableSet = new Set(all);
  const unknown = filters.filter((feature) => !availableSet.has(feature));
  if (unknown.length > 0) {
    console.warn(
      `Warning: requested feature(s) not found in list: ${unknown.join(", ")}`,
    );
  }

  return all.filter((feature) => availableSet.has(feature) && filters.includes(feature));
}

async function fetchJson(url, params = {}) {
  const endpoint = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (!endpoint.searchParams.has(key)) {
      endpoint.searchParams.set(key, String(value));
    }
  });

  // Ensure a response format if caller did not specify one explicitly.
  if (!endpoint.searchParams.has("f")) {
    endpoint.searchParams.set("f", "json");
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function saveJson(filePath, data) {
  const absolutePath = resolve(process.cwd(), filePath);
  try {
    await mkdir(dirname(absolutePath), { recursive: true });
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== "EEXIST"
    ) {
      throw error;
    }
  }
  await writeFile(absolutePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${filePath}`);
}

function buildServiceUrl(feature) {
  return `${SERVICE_BASE}/${encodeURIComponent(feature)}/FeatureServer`;
}

function buildLayerFilename(feature, layer, { isTable }) {
  const prefix = isTable ? "table" : "layer";
  const extension = layer.geometryType ? "geojson" : "json";
  const safeName = layer.name
    ? `_${layer.name.replace(/[^a-zA-Z0-9_-]/g, "_")}`
    : "";
  return `${OUTPUT_BASE}/${feature}/${prefix}_${layer.id}${safeName}.${extension}`;
}

async function downloadFeature(feature) {
  console.log(`\nProcessing ${feature}...`);
  const serviceUrl = buildServiceUrl(feature);

  const metadata = await fetchJson(serviceUrl, { f: "json" });

  if (metadata.error) {
    throw new Error(
      `ArcGIS service returned an error for ${feature}: ${JSON.stringify(metadata.error)}`,
    );
  }

  await saveJson(`${OUTPUT_BASE}/${feature}/service.json`, metadata);

  const layers = Array.isArray(metadata.layers) ? metadata.layers : [];
  const tables = Array.isArray(metadata.tables) ? metadata.tables : [];

  if (layers.length === 0 && tables.length === 0) {
    console.warn(`No layers or tables advertised for ${feature}.`);
    // Still attempt a default layer 0 download as a fallback.
    await downloadLayer(feature, { id: 0, name: "layer_0" }, serviceUrl, {
      isTable: false,
      forceGeoJson: true,
    });
    return;
  }

  for (const layer of layers) {
    await downloadLayer(feature, layer, serviceUrl, { isTable: false });
  }

  for (const table of tables) {
    await downloadLayer(feature, table, serviceUrl, { isTable: true });
  }
}

async function downloadLayer(feature, layer, serviceUrl, options) {
  const { isTable, forceGeoJson = false } = options;
  const layerUrl = `${serviceUrl}/${layer.id}/query`;
  const hasGeometry =
    forceGeoJson || Boolean(layer.geometryType && !isTable);

  const params = {
    where: "1=1",
    outFields: "*",
    f: hasGeometry ? "geojson" : "json",
  };

  if (hasGeometry) {
    params.outSR = "4326";
  }

  const data = await fetchJson(layerUrl, params);
  let processed = data;

  if (
    processed &&
    typeof processed === "object" &&
    processed.type === "FeatureCollection" &&
    Array.isArray(processed.features)
  ) {
    const before = processed.features.length;
    processed = filterFeatureCollectionByBounds(processed, CAMPUS_BOUNDS);
    const after = processed.features.length;
    if (after !== before) {
      console.log(
        `Filtered ${before - after} feature(s) outside campus bounds in ${feature} layer ${layer.id}`,
      );
    }
  }

  const filename = buildLayerFilename(feature, layer, { isTable });
  await saveJson(filename, processed);
}

async function main() {
  const { featureFile, filters } = parseArgs(process.argv);
  const features = await readFeatureNames(featureFile, filters);

  if (features.length === 0) {
    console.warn("No ArcGIS features to download.");
    return;
  }

  for (const feature of features) {
    try {
      await downloadFeature(feature);
    } catch (error) {
      console.error(`Failed to download ${feature}.`);
      if (error instanceof Error) {
        console.error(error.stack ?? error.message);
      } else {
        console.error(error);
      }
    }
  }
}

main().catch((error) => {
  console.error("Unexpected failure while downloading ArcGIS datasets.");
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
