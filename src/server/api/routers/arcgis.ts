import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { loadArcgisGeoJsonLayers } from "@/server/data/arcgis-map";
import type { ArcgisMapPayload } from "@/types/arcgis";

export const arcgisRouter = createTRPCRouter({
  mapData: publicProcedure.query((): ArcgisMapPayload => ({
    layers: loadArcgisGeoJsonLayers(),
  })),
});
