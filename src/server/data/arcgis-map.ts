import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ArcgisGeoJsonLayer, ArcgisLayerCategory } from "@/types/arcgis";
import type { GeoJsonFeatureCollection } from "@/types/geojson";

const JSON_ROOT = join(process.cwd(), "src/server/data/json");

const GEOJSON_PATTERN =
  /^(?<category>layer|table)_(?<id>\d+)(?:_(?<name>.*))?\.geojson$/i;

const sanitizeLayerName = (raw: string | undefined): string =>
  raw?.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim() ?? "";

const parseLayerMetadata = (
  filename: string,
): { category: ArcgisLayerCategory; layerId: number; name: string } | null => {
  const matches = filename.match(GEOJSON_PATTERN);
  if (!matches || !matches.groups) {
    return null;
  }

  const category = matches.groups.category.toLowerCase() as ArcgisLayerCategory;
  const layerId = Number.parseInt(matches.groups.id, 10);
  const rawName = sanitizeLayerName(matches.groups.name);
  const name = rawName.length > 0 ? rawName : `${category}_${layerId}`;

  if (Number.isNaN(layerId)) {
    return null;
  }

  return { category, layerId, name };
};

const readGeoJson = (path: string): GeoJsonFeatureCollection => {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as GeoJsonFeatureCollection;
};

export const loadArcgisGeoJsonLayers = (): ArcgisGeoJsonLayer[] => {
  const features = readdirSync(JSON_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const layers: ArcgisGeoJsonLayer[] = [];

  for (const feature of features) {
    const featureDir = join(JSON_ROOT, feature);

    const entries = readdirSync(featureDir);
    for (const entry of entries) {
      if (!entry.endsWith(".geojson")) {
        continue;
      }

      const metadata = parseLayerMetadata(entry);
      if (!metadata) {
        continue;
      }

      const filePath = join(featureDir, entry);
      try {
        const stats = statSync(filePath);
        if (!stats.isFile()) {
          continue;
        }
      } catch {
        continue;
      }

      const featureCollection = readGeoJson(filePath);
      layers.push({
        feature,
        featureCollection,
        ...metadata,
      });
    }
  }

  return layers.sort((a, b) => {
    const byFeature = a.feature.localeCompare(b.feature);
    if (byFeature !== 0) {
      return byFeature;
    }
    return a.layerId - b.layerId;
  });
};
