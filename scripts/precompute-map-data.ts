import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  ROUTING_LAYER_FEATURES,
  TUNNEL_ROUTING_LAYER_FEATURES,
} from "../src/constants/routing";
import {
  buildBuildingSummaries,
  buildRouteGraphSnapshot,
  computeLayerMetadata,
  createRouteGraphNodes,
} from "../src/server/data/precompute-utils";
import { loadArcgisGeoJsonLayers } from "../src/server/data/arcgis-map";

const OUTPUT_DIR = join(process.cwd(), "src/server/data/generated");

const writeJson = (filename: string, data: unknown) => {
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Wrote ${filename}`);
};

const main = () => {
  const layers = loadArcgisGeoJsonLayers();
  console.log(`Loaded ${layers.length} ArcGIS layers`);

  const buildings = buildBuildingSummaries(layers);
  console.log(`Computed ${buildings.length} building entries`);

  const tunnelNodes = createRouteGraphNodes(
    layers.filter((layer) => TUNNEL_ROUTING_LAYER_FEATURES.has(layer.feature)),
  );
  const fullNodes = createRouteGraphNodes(
    layers.filter((layer) => ROUTING_LAYER_FEATURES.has(layer.feature)),
  );
  const routeGraph = {
    tunnel: buildRouteGraphSnapshot(buildings, tunnelNodes, {
      maxBuildingLinkDistanceMeters: 20,
      fallbackToNearestNode: false,
    }),
    full: buildRouteGraphSnapshot(buildings, fullNodes, {
      maxBuildingLinkDistanceMeters: 60,
    }),
  };
  console.log(
    `Computed route graphs: tunnel=${routeGraph.tunnel.nodes.length} nodes, full=${routeGraph.full.nodes.length} nodes`,
  );

  const metadata = computeLayerMetadata(layers);
  console.log(`Computed metadata for ${metadata.length} layers`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeJson("buildings.json", buildings);
  writeJson("route-graph.json", routeGraph);
  writeJson("layer-metadata.json", metadata);
};

main();
