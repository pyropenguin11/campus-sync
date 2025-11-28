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
import { TUNNEL_HIGHLIGHT } from "@/constants/tunnels";
import type { GeoJsonGeometry } from "@/types/geojson";
import {
  END_MARKER_COLOR,
  MapLibreModule,
  MapViewProps,
  PrimitiveGeometry,
  START_MARKER_COLOR,
  SURFACE_ROUTE_COLOR,
  getLayerStyle,
  type RouteSegment,
} from "./map-view-constants";

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

const toLonLat = ([lat, lon]: RouteSegment["coordinates"][number]): [number, number] => [lon, lat];

export const MapView = ({
  routeLine,
  routeSegments,
  geoJsonLayers,
  startMarker,
  endMarker,
  fitBoundsSequence,
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRegistryRef = useRef<{ layers: string[]; sources: string[] }>({
    layers: [],
    sources: [],
  });
  const ensureSourcesRef = useRef<() => void>(() => undefined);
  const pendingFitBoundsRef = useRef<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const routeFeatureCollection = useMemo(() => {
    if (routeSegments.length === 0) {
      return null;
    }
    return {
      type: "FeatureCollection" as const,
      features: routeSegments.map((segment, index) => ({
        type: "Feature" as const,
        properties: {
          viaTunnel: segment.viaTunnel,
          segmentIndex: index,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: segment.coordinates.map(toLonLat),
        },
      })),
    };
  }, [routeSegments]);

  const markerFeatureCollection = useMemo(() => {
    const features: Array<{
      type: "Feature";
      properties: { markerType: "start" | "end" };
      geometry: { type: "Point"; coordinates: [number, number] };
    }> = [];

    if (startMarker) {
      features.push({
        type: "Feature",
        properties: { markerType: "start" },
        geometry: { type: "Point", coordinates: toLonLat(startMarker) },
      });
    }

    if (endMarker) {
      features.push({
        type: "Feature",
        properties: { markerType: "end" },
        geometry: { type: "Point", coordinates: toLonLat(endMarker) },
      });
    }

    if (features.length === 0) {
      return null;
    }

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [startMarker, endMarker]);

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

    const recordLayer = (layerId: string) => {
      nextLayers.push(layerId);
    };

    const recordSource = (sourceId: string) => {
      nextSources.push(sourceId);
    };

    geoJsonLayers.forEach((layer) => {
      const sourceId = "arcgis-" + layer.feature + "-" + layer.layerId;
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

      if (hasPolygons) {
        const fillId = sourceId + "-fill";
        map.addLayer({
          id: fillId,
          type: "fill",
          source: sourceId,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "fill-color": style.fillColor,
            "fill-opacity": style.fillOpacity,
          },
        });
        recordLayer(fillId);

        const outlineId = sourceId + "-outline";
        const outlinePaint: Record<string, unknown> = {
          "line-color": style.color,
          "line-width": style.weight,
          "line-opacity": style.opacity,
        };
        if (style.dashArray) {
          outlinePaint["line-dasharray"] = style.dashArray
            .split(/\s+/)
            .map((chunk) => Number.parseFloat(chunk))
            .filter((value) => Number.isFinite(value) && value > 0);
        }
        map.addLayer({
          id: outlineId,
          type: "line",
          source: sourceId,
          filter: ["==", "$type", "Polygon"],
          paint: outlinePaint,
        });
        recordLayer(outlineId);
      }

      if (hasLines) {
        const lineId = sourceId + "-line";
        const linePaint: Record<string, unknown> = {
          "line-color": style.color,
          "line-width": Math.max(style.weight - 0.5, 1),
          "line-opacity": style.opacity,
        };
        if (style.dashArray) {
          linePaint["line-dasharray"] = style.dashArray
            .split(/\s+/)
            .map((chunk) => Number.parseFloat(chunk))
            .filter((value) => Number.isFinite(value) && value > 0);
        }
        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          filter: ["==", ["geometry-type"], "LineString"],
          paint: linePaint,
        });
        recordLayer(lineId);
      }
    });

    if (routeFeatureCollection && routeFeatureCollection.features.length > 0) {
      map.addSource("route-highlight", {
        type: "geojson",
        data: routeFeatureCollection,
      });
      recordSource("route-highlight");

      map.addLayer({
        id: "route-highlight-line",
        type: "line",
        source: "route-highlight",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "viaTunnel"], true],
            TUNNEL_HIGHLIGHT,
            SURFACE_ROUTE_COLOR,
          ],
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

    if (markerFeatureCollection && markerFeatureCollection.features.length > 0) {
      map.addSource("route-markers", {
        type: "geojson",
        data: markerFeatureCollection,
      });
      recordSource("route-markers");

      map.addLayer({
        id: "route-markers-circle",
        type: "circle",
        source: "route-markers",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "case",
            ["==", ["get", "markerType"], "start"],
            START_MARKER_COLOR,
            ["==", ["get", "markerType"], "end"],
            END_MARKER_COLOR,
            START_MARKER_COLOR,
          ],
          "circle-opacity": 0.95,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      recordLayer("route-markers-circle");
    }

    layerRegistryRef.current = {
      layers: nextLayers,
      sources: nextSources,
    };
  }, [geoJsonLayers, routeFeatureCollection, markerFeatureCollection]);

  ensureSourcesRef.current = ensureSources;

  const applyRouteFit = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const points: Array<[number, number]> = [];
    routeLine.forEach(([lat, lon]) => {
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        points.push([lon, lat]);
      }
    });
    if (startMarker) {
      const [lat, lon] = startMarker;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        points.push([lon, lat]);
      }
    }
    if (endMarker) {
      const [lat, lon] = endMarker;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        points.push([lon, lat]);
      }
    }

    if (points.length === 0) {
      return;
    }

    let minLat = Number.POSITIVE_INFINITY;
    let minLon = Number.POSITIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    let maxLon = Number.NEGATIVE_INFINITY;

    points.forEach(([lon, lat]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    });

    if (
      !Number.isFinite(minLat) ||
      !Number.isFinite(maxLat) ||
      !Number.isFinite(minLon) ||
      !Number.isFinite(maxLon)
    ) {
      return;
    }

    const SINGLE_POINT_PADDING_DEGREES = 0.0008;
    if (minLat === maxLat) {
      minLat -= SINGLE_POINT_PADDING_DEGREES;
      maxLat += SINGLE_POINT_PADDING_DEGREES;
    }
    if (minLon === maxLon) {
      minLon -= SINGLE_POINT_PADDING_DEGREES;
      maxLon += SINGLE_POINT_PADDING_DEGREES;
    }

    map.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      {
        padding: 80,
        maxZoom: 18,
        duration: 650,
      },
    );
  }, [endMarker, routeLine, startMarker]);

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
          keyboard: false,
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
            if (typeof mapAny.touchZoomRotate?.disableRotation === "function") {
              mapAny.touchZoomRotate.disableRotation();
            }
            if (typeof mapAny.keyboard?.disable === "function") {
              mapAny.keyboard.disable();
            }
            ensureSourcesRef.current();
            if (pendingFitBoundsRef.current !== null) {
              applyRouteFit();
              pendingFitBoundsRef.current = null;
            }
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
      pendingFitBoundsRef.current = null;
    };
  }, [applyRouteFit, osmTileUrls]);

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

  useEffect(() => {
    if (fitBoundsSequence <= 0) {
      return;
    }
    const map = mapRef.current;
    if (!map) {
      pendingFitBoundsRef.current = fitBoundsSequence;
      return;
    }
    pendingFitBoundsRef.current = null;
    applyRouteFit();
  }, [applyRouteFit, fitBoundsSequence]);

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
