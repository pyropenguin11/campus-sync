import type { ArcgisLayerCategory } from "@/types/arcgis";
import type { LatLngTuple } from "@/types/tunnels";

export interface BuildingSummary {
  id: string;
  name: string;
  position: LatLngTuple;
  tokens: string[];
  exactTokens: string[];
}

export interface RouteGraphNeighbor {
  id: string;
  weight: number;
}

export interface RouteGraphNodeSnapshot {
  id: string;
  position: LatLngTuple;
  neighbors: RouteGraphNeighbor[];
}

export interface RouteGraphSnapshot {
  nodes: RouteGraphNodeSnapshot[];
  buildingToNearestNode: Record<string, string>;
}

export interface RouteGraphBundle {
  tunnel: RouteGraphSnapshot;
  full: RouteGraphSnapshot;
}

export interface LayerMetadata {
  feature: string;
  layerId: number;
  category: ArcgisLayerCategory;
  name: string;
  featureCount: number;
  geometryTypes: {
    polygon: boolean;
    line: boolean;
    point: boolean;
  };
  bbox: [number, number, number, number] | null;
}
