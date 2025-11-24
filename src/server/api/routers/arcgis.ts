import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getArcgisLayerById, loadArcgisGeoJsonLayers } from "@/server/data/arcgis-map";
import {
  getLayerMetadata,
  getPrecomputedBuildings,
  getPrecomputedRouteGraph,
} from "@/server/data/precomputed-map";

export const arcgisRouter = createTRPCRouter({
  layers: publicProcedure.query(() => loadArcgisGeoJsonLayers()),
  buildings: publicProcedure.query(() => getPrecomputedBuildings()),
  routeGraph: publicProcedure.query(() => getPrecomputedRouteGraph()),
  layerMetadata: publicProcedure.query(() => getLayerMetadata()),
  layer: publicProcedure
    .input(z.object({ feature: z.string(), layerId: z.number() }))
    .query(({ input }) => getArcgisLayerById(input.feature, input.layerId)),
});
