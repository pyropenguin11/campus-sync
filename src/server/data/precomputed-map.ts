import { readFileSync } from "fs";
import { join } from "path";
import type {
  BuildingSummary,
  LayerMetadata,
  RouteGraphBundle,
} from "../../types/map-data";

const GENERATED_ROOT = join(process.cwd(), "src/server/data/generated");

const BUILDINGS_PATH = join(GENERATED_ROOT, "buildings.json");
const ROUTE_GRAPH_PATH = join(GENERATED_ROOT, "route-graph.json");
const LAYER_METADATA_PATH = join(GENERATED_ROOT, "layer-metadata.json");

type PrecomputedData = {
  buildings: BuildingSummary[];
  routeGraph: RouteGraphBundle;
  metadata: LayerMetadata[];
};

const readJson = <T>(path: string): T => {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as T;
};

let cache: PrecomputedData | null = null;

const loadPrecomputedData = (): PrecomputedData => {
  if (!cache) {
    cache = {
      buildings: readJson<BuildingSummary[]>(BUILDINGS_PATH),
      routeGraph: readJson<RouteGraphBundle>(ROUTE_GRAPH_PATH),
      metadata: readJson<LayerMetadata[]>(LAYER_METADATA_PATH),
    };
  }
  return cache;
};

export const getPrecomputedBuildings = (): BuildingSummary[] =>
  loadPrecomputedData().buildings;

export const getPrecomputedRouteGraph = (): RouteGraphBundle =>
  loadPrecomputedData().routeGraph;

export const getLayerMetadata = (): LayerMetadata[] =>
  loadPrecomputedData().metadata;

export const refreshPrecomputedMapData = (): PrecomputedData => {
  cache = null;
  return loadPrecomputedData();
};
