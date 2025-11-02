'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MAP_CENTER,
  MAP_ZOOM,
  TILE_ATTRIBUTION,
  TILE_LAYER_URL,
} from "@/constants/map";
import { NODE_COLORS, TUNNEL_HIGHLIGHT } from "@/constants/tunnels";
import type { ArcgisGeoJsonLayer } from "@/types/arcgis";
import type { GeoJsonGeometry } from "@/types/geojson";
import type { LatLngTuple, TunnelNode } from "@/types/tunnels";

type MapLibreModule = typeof import("maplibre-gl");

type MapViewProps = {
  routePoints: LatLngTuple[];
  nodes: TunnelNode[];
  geoJsonLayers: ArcgisGeoJsonLayer[];
  routeNodeIds: string[];
  startNodeId?: string | null;
  endNodeId?: string | null;
};

type Bounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

const createEmptyBounds = (): Bounds => ({
  minLat: Number.POSITIVE_INFINITY,
  maxLat: Number.NEGATIVE_INFINITY,
  minLon: Number.POSITIVE_INFINITY,
  maxLon: Number.NEGATIVE_INFINITY,
});

const extendBounds = (bounds: Bounds, lat: number, lon: number) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  if (lat < bounds.minLat) bounds.minLat = lat;
  if (lat > bounds.maxLat) bounds.maxLat = lat;
  if (lon < bounds.minLon) bounds.minLon = lon;
  if (lon > bounds.maxLon) bounds.maxLon = lon;
};

const isBoundsValid = (bounds: Bounds): boolean =>
  Number.isFinite(bounds.minLat) &&
  Number.isFinite(bounds.maxLat) &&
  Number.isFinite(bounds.minLon) &&
  Number.isFinite(bounds.maxLon) &&
  bounds.minLat <= bounds.maxLat &&
  bounds.minLon <= bounds.maxLon;

type PrimitiveGeometry = "polygon" | "line" | "point";

const geometryMatches = (
  geometry: GeoJsonGeometry | null | undefined,
  type: PrimitiveGeometry,
): boolean => {
  if (!geometry) return false;

  switch (geometry.type) {
    case "Polygon":
    case "MultiPolygon":
      return type === "polygon";
    case "LineString":
    case "MultiLineString":
      return type === "line";
    case "Point":
    case "MultiPoint":
      return type === "point";
    case "GeometryCollection":
      return geometry.geometries.some((child) =>
        geometryMatches(child, type),
      );
    default:
      return false;
  }
};

const visitGeometry = (
  geometry: GeoJsonGeometry | null | undefined,
  visit: (lat: number, lon: number) => void,
): void => {
  if (!geometry) return;

  switch (geometry.type) {
    case "Point": {
      const [lon, lat] = geometry.coordinates;
      visit(lat, lon);
      break;
    }
    case "MultiPoint":
      geometry.coordinates.forEach(([lon, lat]) => visit(lat, lon));
      break;
    case "LineString":
      geometry.coordinates.forEach(([lon, lat]) => visit(lat, lon));
      break;
    case "MultiLineString":
      geometry.coordinates.forEach((line) =>
        line.forEach(([lon, lat]) => visit(lat, lon)),
      );
      break;
    case "Polygon":
      geometry.coordinates.forEach((ring) =>
        ring.forEach(([lon, lat]) => visit(lat, lon)),
      );
      break;
    case "MultiPolygon":
      geometry.coordinates.forEach((polygon) =>
        polygon.forEach((ring) =>
          ring.forEach(([lon, lat]) => visit(lat, lon)),
        ),
      );
      break;
    case "GeometryCollection":
      geometry.geometries.forEach((child) => visitGeometry(child, visit));
      break;
    default:
      break;
  }
};

const toLonLat = ([lat, lon]: LatLngTuple): [number, number] => [lon, lat];

type PolygonRenderStyle = {
  color: string;
  weight: number;
  opacity: number;
  fillColor: string;
  fillOpacity: number;
  dashArray?: string;
};

type PointRenderStyle = {
  radius: number;
  color: string;
  weight: number;
  fillColor: string;
  fillOpacity: number;
};

type LayerStyle = {
  polygon: PolygonRenderStyle;
  point: PointRenderStyle;
};

type LayerStyleOverrides = {
  polygon?: Partial<PolygonRenderStyle>;
  point?: Partial<PointRenderStyle>;
};

const DEFAULT_POLYGON_STYLE: PolygonRenderStyle = {
  color: "#2563eb",
  weight: 1.5,
  opacity: 0.9,
  fillColor: "#60a5fa",
  fillOpacity: 0.2,
};

const DEFAULT_POINT_STYLE: PointRenderStyle = {
  radius: 6,
  color: "#ffffff",
  weight: 2,
  fillColor: "#2563eb",
  fillOpacity: 0.95,
};

const LAYER_STYLE_OVERRIDES: Record<string, LayerStyleOverrides> = {
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
  GW_ELEVATORS: {
    point: {
      fillColor: "#ef4444",
      color: "#ffffff",
      radius: 5,
      weight: 2,
    },
  },
  GW_QR_CODE_LOCS: {
    point: {
      fillColor: "#22d3ee",
      color: "#0f172a",
      radius: 4,
    },
  },
  GW_INFO_LABELS: {
    point: {
      fillColor: "#a855f7",
      color: "#ffffff",
      radius: 4,
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

const getLayerStyle = (feature: string): LayerStyle => {
  const override = LAYER_STYLE_OVERRIDES[feature] ?? {};
  return {
    polygon: { ...DEFAULT_POLYGON_STYLE, ...(override.polygon ?? {}) },
    point: { ...DEFAULT_POINT_STYLE, ...(override.point ?? {}) },
  };
};

const parseDashArray = (value: string | undefined): number[] | undefined => {
  if (!value) return undefined;
  const parts = value
    .split(/\s+/)
    .map((item) => Number.parseFloat(item))
    .filter((item) => Number.isFinite(item) && item > 0);

  return parts.length > 0 ? parts : undefined;
};

const NODE_COLOR_EXPRESSION: unknown[] = [
  "match",
  ["get", "nodeType"],
  "academic",
  NODE_COLORS.academic,
  "student",
  NODE_COLORS.student,
  "research",
  NODE_COLORS.research,
  NODE_COLORS.academic,
];

export const MapView = ({
  routePoints,
  nodes,
  geoJsonLayers,
  routeNodeIds,
  startNodeId,
  endNodeId,
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRegistryRef = useRef<{ layers: string[]; sources: string[] }>({
    layers: [],
    sources: [],
  });
  const ensureSourcesRef = useRef<() => void>(() => undefined);
  const hasFitBoundsRef = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const routeFeatureCollection = useMemo(() => {
    if (routePoints.length < 2) {
      return null;
    }

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: routePoints.map((point) => toLonLat(point)),
          },
        },
      ],
    };
  }, [routePoints]);

  const nodeFeatureCollection = useMemo(() => {
    const routeSet = new Set(routeNodeIds);
    const features = nodes
      .filter(
        (node) =>
          routeSet.has(node.id) ||
          node.id === startNodeId ||
          node.id === endNodeId,
      )
      .map((node) => ({
        type: "Feature" as const,
        properties: {
          id: node.id,
          nodeType: node.type,
          name: node.name,
          inRoute: routeSet.has(node.id),
          isStart: startNodeId === node.id,
          isEnd: endNodeId === node.id,
        },
        geometry: {
          type: "Point" as const,
          coordinates: toLonLat(node.position),
        },
      }));

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [nodes, routeNodeIds, startNodeId, endNodeId]);

  const osmTileUrls = useMemo(() => {
    if (!TILE_LAYER_URL.includes("{s}")) {
      return [TILE_LAYER_URL];
    }
    return ["a", "b", "c"].map((subdomain) =>
      TILE_LAYER_URL.replace("{s}", subdomain),
    );
  }, []);

  const ensureSources = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const { layers, sources } = layerRegistryRef.current;
    [...layers].reverse().forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    [...sources].reverse().forEach((sourceId) => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    const nextLayers: string[] = [];
    const nextSources: string[] = [];

    const bounds = createEmptyBounds();

    const recordLayer = (layerId: string) => {
      nextLayers.push(layerId);
    };

    const recordSource = (sourceId: string) => {
      nextSources.push(sourceId);
    };

    geoJsonLayers.forEach((layer) => {
      const sourceId = `arcgis-${layer.feature}-${layer.layerId}`;
      map.addSource(sourceId, {
        type: "geojson",
        data: layer.featureCollection,
      });
      recordSource(sourceId);

      const style = getLayerStyle(layer.feature);
      const hasPolygons = layer.featureCollection.features.some((feature) =>
        geometryMatches(feature.geometry, "polygon"),
      );
      const hasLines = layer.featureCollection.features.some((feature) =>
        geometryMatches(feature.geometry, "line"),
      );
      const hasPoints = layer.featureCollection.features.some((feature) =>
        geometryMatches(feature.geometry, "point"),
      );

      layer.featureCollection.features.forEach((feature) => {
        visitGeometry(feature.geometry, (lat, lon) => extendBounds(bounds, lat, lon));
      });

      if (hasPolygons) {
        const fillId = `${sourceId}-fill`;
        const polygonFilter: unknown[] = [
          "any",
          ["==", ["geometry-type"], "Polygon"],
          ["==", ["geometry-type"], "MultiPolygon"],
        ];
        map.addLayer({
          id: fillId,
          type: "fill",
          source: sourceId,
          filter: polygonFilter,
          paint: {
            "fill-color": style.polygon.fillColor,
            "fill-opacity": style.polygon.fillOpacity,
          },
        });
        recordLayer(fillId);

        const outlineId = `${sourceId}-outline`;
        const linePaint: Record<string, unknown> = {
          "line-color": style.polygon.color,
          "line-width": style.polygon.weight,
          "line-opacity": style.polygon.opacity,
        };
        const dashArray = parseDashArray(style.polygon.dashArray);
        if (dashArray) {
          linePaint["line-dasharray"] = dashArray;
        }
        map.addLayer({
          id: outlineId,
          type: "line",
          source: sourceId,
          filter: polygonFilter,
          paint: linePaint,
        });
        recordLayer(outlineId);
      }

      if (hasLines) {
        const lineId = `${sourceId}-line`;
        const lineFilter: unknown[] = [
          "any",
          ["==", ["geometry-type"], "LineString"],
          ["==", ["geometry-type"], "MultiLineString"],
        ];
        const linePaint: Record<string, unknown> = {
          "line-color": style.polygon.color,
          "line-width": Math.max(style.polygon.weight - 0.5, 1),
          "line-opacity": style.polygon.opacity,
        };
        const dashArray = parseDashArray(style.polygon.dashArray);
        if (dashArray) {
          linePaint["line-dasharray"] = dashArray;
        }

        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          filter: lineFilter,
          paint: linePaint,
        });
        recordLayer(lineId);
      }

      if (hasPoints) {
        layer.featureCollection.features.forEach((feature) => {
          visitGeometry(feature.geometry, (lat, lon) =>
            extendBounds(bounds, lat, lon),
          );
        });
      }
    });

    if (routeFeatureCollection && routeFeatureCollection.features.length > 0) {
      map.addSource("route-highlight", {
        type: "geojson",
        data: routeFeatureCollection,
      });
      recordSource("route-highlight");

      routeFeatureCollection.features[0].geometry.coordinates.forEach(
        ([lon, lat]) => extendBounds(bounds, lat, lon),
      );

      map.addLayer({
        id: "route-highlight-line",
        type: "line",
        source: "route-highlight",
        paint: {
          "line-color": TUNNEL_HIGHLIGHT,
          "line-width": 5,
          "line-opacity": 0.9,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });
      recordLayer("route-highlight-line");
    }

    if (nodeFeatureCollection.features.length > 0) {
      map.addSource("tunnel-nodes", {
        type: "geojson",
        data: nodeFeatureCollection,
      });
      recordSource("tunnel-nodes");

      nodeFeatureCollection.features.forEach((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        extendBounds(bounds, lat, lon);
      });

      const nodeColorExpression: unknown[] = [
        "case",
        ["boolean", ["get", "isStart"], false],
        "#22c55e",
        ["boolean", ["get", "isEnd"], false],
        "#ef4444",
        ["boolean", ["get", "inRoute"], false],
        "#facc15",
        NODE_COLOR_EXPRESSION,
      ];
      const nodeRadiusExpression: unknown[] = [
        "case",
        ["boolean", ["get", "isStart"], false],
        9,
        ["boolean", ["get", "isEnd"], false],
        9,
        ["boolean", ["get", "inRoute"], false],
        8,
        7,
      ];
      const nodeStrokeWidthExpression: unknown[] = [
        "case",
        ["boolean", ["get", "isStart"], false],
        3,
        ["boolean", ["get", "isEnd"], false],
        3,
        ["boolean", ["get", "inRoute"], false],
        2.5,
        2,
      ];

      map.addLayer({
        id: "tunnel-nodes-circle",
        type: "circle",
        source: "tunnel-nodes",
        paint: {
          "circle-radius": nodeRadiusExpression,
          "circle-color": nodeColorExpression,
          "circle-opacity": 0.95,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": nodeStrokeWidthExpression,
        },
      });
      recordLayer("tunnel-nodes-circle");
    }

    layerRegistryRef.current = {
      layers: nextLayers,
      sources: nextSources,
    };

    if (isBoundsValid(bounds) && !hasFitBoundsRef.current) {
      map.fitBounds(
        [
          [bounds.minLon, bounds.minLat],
          [bounds.maxLon, bounds.maxLat],
        ],
        {
          padding: 60,
          maxZoom: 18,
          duration: 0,
        },
      );
      hasFitBoundsRef.current = true;
    }
  }, [
    geoJsonLayers,
    nodeFeatureCollection,
    routeFeatureCollection,
  ]);

  ensureSourcesRef.current = ensureSources;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let isDestroyed = false;

    setMapError(null);

    const initialize = async () => {
      try {
        const maplibregl: MapLibreModule = await import("maplibre-gl");
        if (isDestroyed || !containerRef.current) {
          return;
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              "osm-base": {
                type: "raster",
                tiles: osmTileUrls,
                tileSize: 256,
                attribution: TILE_ATTRIBUTION,
              },
            },
            layers: [
              {
                id: "osm-base",
                type: "raster",
                source: "osm-base",
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: [MAP_CENTER[1], MAP_CENTER[0]],
          zoom: MAP_ZOOM,
          minZoom: 12,
          maxZoom: 20,
          pitch: 0,
          bearing: 0,
          maxPitch: 0,
          dragRotate: false,
          pitchWithRotate: false,
          pitchWithTwoFingerDrag: false,
        });

        const mapAny: any = map;

        mapRef.current = map;

        if (maplibregl.NavigationControl) {
          map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        }

        const handleLoad = () => {
          if (!isDestroyed) {
            if (typeof mapAny.dragRotate?.disable === "function") {
              mapAny.dragRotate.disable();
            }
            if (
              typeof mapAny.touchZoomRotate?.disableRotation === "function"
            ) {
              mapAny.touchZoomRotate.disableRotation();
            }
            ensureSourcesRef.current();
          }
        };

        map.once("load", handleLoad);
      } catch (error) {
        console.error("Failed to load MapLibre GL", error);
        if (!isDestroyed) {
          setMapError("Unable to load map view right now.");
        }
      }
    };

    void initialize();

    return () => {
      isDestroyed = true;
      const map = mapRef.current;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
      layerRegistryRef.current = { layers: [], sources: [] };
      hasFitBoundsRef.current = false;
    };
  }, [osmTileUrls]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (typeof map.isStyleLoaded === "function" && !map.isStyleLoaded()) {
      const handleLoad = () => {
        ensureSources();
      };
      map.once("load", handleLoad);
      return () => {
        if (typeof map.off === "function") {
          map.off("load", handleLoad);
        }
      };
    }

    ensureSources();
  }, [ensureSources]);

  if (mapError) {
    return <div className="map-shell map-error">{mapError}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="map-shell"
      role="application"
      aria-label="Campus map"
    />
  );
};
