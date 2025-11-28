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

type PolygonRenderStyle = {
  color: string;
  weight: number;
  opacity: number;
  fillColor: string;
  fillOpacity: number;
  dashArray?: string;
};

type LayerStyleOverrides = {
  polygon?: Partial<PolygonRenderStyle>;
};

export const DEFAULT_POLYGON_STYLE: PolygonRenderStyle = {
  color: "#2563eb",
  weight: 1.5,
  opacity: 0.9,
  fillColor: "#60a5fa",
  fillOpacity: 0.2,
};

export const SURFACE_ROUTE_COLOR = "#3b82f6";

export const LAYER_STYLE_OVERRIDES: Record<string, LayerStyleOverrides> = {
  GOPHER_WAY_LEVEL_BLDGS: {
    polygon: {
      color: "#0ea5e9",
      fillColor: "#38bdf8",
      fillOpacity: 0.15,
    },
  },
  GW_CIRCULATION_AREAS: {
    polygon: {
      color: "#f59e0b",
      fillColor: "#facc15",
      fillOpacity: 0.25,
    },
  },
  GW_NON_ADA_ACCESSIBLE: {
    polygon: {
      color: "#f97316",
      dashArray: "6 4",
      fillOpacity: 0.1,
    },
  },
  GW_FP_LINES_STAIRS: {
    polygon: {
      color: "#34d399",
      dashArray: "4 4",
      fillOpacity: 0.08,
    },
  },
  GW_FP_GROSS_AREA: {
    polygon: {
      color: "#f472b6",
      fillColor: "#fbcfe8",
      fillOpacity: 0.12,
    },
  },
  GW_PORTION_DIFFERENT_LEVEL: {
    polygon: {
      color: "#f87171",
      fillColor: "#fecaca",
      fillOpacity: 0.18,
    },
  },
  GW_FLOOR_NAME_CHANGE: {
    polygon: {
      color: "#22c55e",
      dashArray: "2 6",
      fillOpacity: 0.08,
    },
  },
};

export const START_MARKER_COLOR = "#22c55e";
export const END_MARKER_COLOR = "#ef4444";

export const getLayerStyle = (feature: string): PolygonRenderStyle => {
  const override = LAYER_STYLE_OVERRIDES[feature]?.polygon ?? {};
  return { ...DEFAULT_POLYGON_STYLE, ...override };
};
