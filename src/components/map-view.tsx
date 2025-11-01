'use client';

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LEAFLET_CSS_CDN,
  LEAFLET_JS_CDN,
  MAP_CENTER,
  MAP_ZOOM,
  TILE_ATTRIBUTION,
  TILE_LAYER_URL,
} from "@/constants/map";
import {
  NODE_COLORS,
  NODE_TYPE_LABEL,
  TUNNEL_HIGHLIGHT,
  TUNNEL_STROKE,
} from "@/constants/tunnels";
import type { LatLngTuple, TunnelNode } from "@/types/tunnels";

type LeafletInstance = any;

let leafletLoader: Promise<LeafletInstance | null> | null = null;

const ensureLeafletStylesheet = () => {
  if (typeof document === "undefined") return;
  const existing = document.querySelector<HTMLLinkElement>("link[data-leaflet]");
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_CDN;
  link.integrity =
    "sha512-pMpr2bqBiKx2ATs3nV846dOOxzXMZO08h8tZz7ZxbYlR5c+3F4iAfDdc/K1Ji/7luWGINuD/7++PK5H+0uQ1pg==";
  link.crossOrigin = "";
  link.setAttribute("data-leaflet", "true");
  document.head.appendChild(link);
};

const loadLeaflet = async (): Promise<LeafletInstance | null> => {
  if (typeof window === "undefined") return null;
  const existing = (window as typeof window & { L?: LeafletInstance }).L;
  if (existing) return existing;

  if (!leafletLoader) {
    ensureLeafletStylesheet();

    leafletLoader = new Promise<LeafletInstance | null>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = LEAFLET_JS_CDN;
      script.async = true;
      script.integrity =
        "sha512-y7m90PgsSjD/F7kh/3Gzdhvj1io8GZFODdgNpTi27C/medfyqCkCmDYJLdnOjFkWDXe4sdRQ4pQMBYbgl2hF0A==";
      script.crossOrigin = "";
      script.onload = () => resolve((window as any).L ?? null);
      script.onerror = () => reject(new Error("Leaflet failed to load"));
      document.body.appendChild(script);
    }).catch(() => null);
  }

  return leafletLoader;
};

export type MapViewProps = {
  tunnelSegments: Array<[LatLngTuple, LatLngTuple]>;
  routePoints: LatLngTuple[];
  nodes: TunnelNode[];
  onMapReady: (map: LeafletInstance | null) => void;
};

export const MapView = ({
  tunnelSegments,
  routePoints,
  nodes,
  onMapReady,
}: MapViewProps) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mapInstance: LeafletInstance | null = null;
    let layers: LeafletInstance[] = [];
    let cancelled = false;

    setMapError(null);

    loadLeaflet()
      .then((L) => {
        if (cancelled) return;
        if (!L) {
          setMapError("Unable to load map tiles right now.");
          onMapReady(null);
          return;
        }

        const target = mapContainerRef.current;
        if (!target) {
          onMapReady(null);
          return;
        }

        mapInstance = L.map(target, {
          center: MAP_CENTER,
          zoom: MAP_ZOOM,
          scrollWheelZoom: true,
          zoomControl: false,
        });

        L.tileLayer(TILE_LAYER_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: 20,
        }).addTo(mapInstance);

        tunnelSegments.forEach((segment) => {
          const layer = L.polyline(segment, {
            color: TUNNEL_STROKE,
            weight: 4,
            opacity: 0.92,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(mapInstance);
          layers.push(layer);
        });

        if (routePoints.length > 1) {
          const highlightLayer = L.polyline(routePoints, {
            color: TUNNEL_HIGHLIGHT,
            weight: 6,
            opacity: 0.88,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(mapInstance);
          layers.push(highlightLayer);
        }

        nodes.forEach((node) => {
          const marker = L.circleMarker(node.position, {
            color: "#ffffff",
            weight: 2,
            fillColor: NODE_COLORS[node.type],
            fillOpacity: 0.95,
            radius: 9,
          }).addTo(mapInstance);

          marker.bindTooltip(
            `<div class="tooltip-title">${node.name}</div><div class="tooltip-meta">${NODE_TYPE_LABEL[node.type]}</div>`,
            {
              direction: "top",
              offset: [0, -12],
              opacity: 0.95,
              className: "node-tooltip",
            },
          );
          layers.push(marker);
        });

        onMapReady(mapInstance);
        return null;
      })
      .catch(() => {
        if (cancelled) return;
        setMapError("Unable to load map tiles right now.");
        onMapReady(null);
      });

    return () => {
      cancelled = true;
      if (layers.length > 0) {
        layers.forEach((layer) => {
          if (layer?.remove) layer.remove();
        });
      }
      if (mapInstance) {
        mapInstance.remove();
      }
      onMapReady(null);
    };
  }, [tunnelSegments, routePoints, nodes, onMapReady]);

  if (mapError) {
    return <div className="map-error">{mapError}</div>;
  }

  return (
    <div
      ref={mapContainerRef}
      className="map-shell"
      role="application"
      aria-label="Campus map"
    />
  );
};
