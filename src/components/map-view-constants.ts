import type { ArcgisGeoJsonLayer } from "@/types/arcgis";
import type { LatLngTuple } from "@/types/tunnels";

export type MapLibreModule = typeof import("maplibre-gl");

export type PrimitiveGeometry = "polygon" | "line" | "point";

export type RouteSegment = {
  coordinates: [LatLngTuple, LatLngTuple];
  viaTunnel: boolean;
};

export type MapViewProps = {
  routeLine: LatLngTuple[];
  routeSegments: RouteSegment[];
  geoJsonLayers: ArcgisGeoJsonLayer[];
  startMarker?: LatLngTuple | null;
  endMarker?: LatLngTuple | null;
  fitBoundsSequence: number;
};

export const TUNNEL_ROUTE_COLOR = "#ffcc33";
export const SURFACE_ROUTE_COLOR = "#7a0019";
export const START_MARKER_COLOR = "#22c55e";
export const END_MARKER_COLOR = "#ef4444";