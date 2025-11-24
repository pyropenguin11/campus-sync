import type { GeoJsonFeatureCollection } from "@/types/geojson";

export type ArcgisLayerCategory = "layer" | "table";

export interface ArcgisGeoJsonLayer {
  feature: string;
  layerId: number;
  category: ArcgisLayerCategory;
  name: string;
  featureCollection: GeoJsonFeatureCollection;
}
