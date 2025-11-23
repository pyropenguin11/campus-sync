'use client';

import { useCallback, useMemo, useState } from "react";
import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MapView } from "@/components/map-view";
import type { GeoJsonGeometry } from "@/types/geojson";
import type { LatLngTuple } from "@/types/tunnels";
import { api } from "@/trpc/client";

type BuildingOption = {
  id: string;
  name: string;
  position: LatLngTuple;
  tokens: string[];
  exactTokens: string[];
};

const normalizeToken = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();
  if (!normalized) return null;
  return normalized;
};

const computeFeatureCentroid = (
  geometry: GeoJsonGeometry | null | undefined,
): LatLngTuple | null => {
  if (!geometry) return null;

  let sumLat = 0;
  let sumLon = 0;
  let count = 0;

  const record = (lon: number, lat: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    sumLat += lat;
    sumLon += lon;
    count += 1;
  };

  const walk = (geom: GeoJsonGeometry | null | undefined) => {
    if (!geom) return;
    switch (geom.type) {
      case "Point":
        record(geom.coordinates[0], geom.coordinates[1]);
        break;
      case "MultiPoint":
      case "LineString":
        geom.coordinates.forEach(([lon, lat]) => record(lon, lat));
        break;
      case "MultiLineString":
      case "Polygon":
        geom.coordinates.forEach((segment) => {
          segment.forEach(([lon, lat]) => record(lon, lat));
        });
        break;
      case "MultiPolygon":
        geom.coordinates.forEach((polygon) => {
          polygon.forEach((ring) => {
            ring.forEach(([lon, lat]) => record(lon, lat));
          });
        });
        break;
      case "GeometryCollection":
        geom.geometries.forEach((child) => walk(child));
        break;
      default:
        break;
    }
  };

  walk(geometry);

  if (count === 0) return null;
  return [sumLat / count, sumLon / count];
};

const ROUTING_LAYER_FEATURES = new Set<string>([
  "GW_ROUTE",
  "CAMPUS_STREET_NETWORK",
  "GW_PORTION_DIFFERENT_LEVEL",
]);

const ROUTING_BRIDGE_DISTANCE_METERS = 3;

const distanceSquared = (a: LatLngTuple, b: LatLngTuple): number => {
  const dLat = a[0] - b[0];
  const dLon = a[1] - b[1];
  return dLat * dLat + dLon * dLon;
};

export default function HomePage() {
  const { data: arcgisData } = api.arcgis.mapData.useQuery();
  const geoJsonLayers = arcgisData?.layers ?? [];

  const [startBuildingId, setStartBuildingId] = useState<string>("");
  const [endBuildingId, setEndBuildingId] = useState<string>("");
  const [startQuery, setStartQuery] = useState<string>("");
  const [endQuery, setEndQuery] = useState<string>("");
  const [routeNodeIds, setRouteNodeIds] = useState<string[]>([]);
  const [fitBoundsSequence, setFitBoundsSequence] = useState(0);
  const [routeAttempted, setRouteAttempted] = useState(false);

  const routingLayers = useMemo(
    () =>
      geoJsonLayers.filter((layer) =>
        ROUTING_LAYER_FEATURES.has(layer.feature),
      ),
    [geoJsonLayers],
  );

  type RouteGraphNode = {
    position: LatLngTuple;
    neighbors: Map<string, number>;
  };

  const routeGraph = useMemo(() => {
    const nodes = new Map<string, RouteGraphNode>();
    if (routingLayers.length === 0) {
      return { nodes };
    }

    const keyFor = (lat: number, lon: number): string =>
      `${lat.toFixed(6)},${lon.toFixed(6)}`;

    const ensureNode = (lat: number, lon: number): string => {
      const key = keyFor(lat, lon);
      if (!nodes.has(key)) {
        nodes.set(key, {
          position: [lat, lon],
          neighbors: new Map(),
        });
      }
      return key;
    };

    const haversineDistance = (a: LatLngTuple, b: LatLngTuple): number => {
      const R = 6371000;
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const dLat = toRad(b[0] - a[0]);
      const dLon = toRad(b[1] - a[1]);
      const lat1 = toRad(a[0]);
      const lat2 = toRad(b[0]);
      const sinLat = Math.sin(dLat / 2);
      const sinLon = Math.sin(dLon / 2);
      const h =
        sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
      const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      return R * c;
    };

    const addEdge = (fromKey: string, toKey: string) => {
      if (fromKey === toKey) return;
      const fromNode = nodes.get(fromKey);
      const toNode = nodes.get(toKey);
      if (!fromNode || !toNode) return;
      const distance = haversineDistance(fromNode.position, toNode.position);
      const existingForward = fromNode.neighbors.get(toKey);
      if (!existingForward || distance < existingForward) {
        fromNode.neighbors.set(toKey, distance);
      }
      const existingBackward = toNode.neighbors.get(fromKey);
      if (!existingBackward || distance < existingBackward) {
        toNode.neighbors.set(fromKey, distance);
      }
    };

    const processLine = (coordinates: number[][]) => {
      for (let index = 0; index < coordinates.length - 1; index += 1) {
        const [lonA, latA] = coordinates[index];
        const [lonB, latB] = coordinates[index + 1];
        const keyA = ensureNode(latA, lonA);
        const keyB = ensureNode(latB, lonB);
        addEdge(keyA, keyB);
      }
    };

    const walkGeometry = (geometry: GeoJsonGeometry | null | undefined) => {
      if (!geometry) return;
      switch (geometry.type) {
        case "LineString":
          processLine(geometry.coordinates);
          break;
        case "MultiLineString":
          geometry.coordinates.forEach((segment) => processLine(segment));
          break;
        case "GeometryCollection":
          geometry.geometries.forEach((child) => walkGeometry(child));
          break;
        default:
          break;
      }
    };

    routingLayers.forEach((layer) => {
      layer.featureCollection.features.forEach((feature) => {
        walkGeometry(feature.geometry as GeoJsonGeometry | null | undefined);
      });
    });

    if (nodes.size > 1 && ROUTING_BRIDGE_DISTANCE_METERS > 0) {
      const nodeEntries = Array.from(nodes.entries());
      for (let outer = 0; outer < nodeEntries.length; outer += 1) {
        const [idA, nodeA] = nodeEntries[outer];
        for (let inner = outer + 1; inner < nodeEntries.length; inner += 1) {
          const [idB, nodeB] = nodeEntries[inner];
          if (nodeA.neighbors.has(idB) || nodeB.neighbors.has(idA)) {
            continue;
          }
          const distance = haversineDistance(nodeA.position, nodeB.position);
          if (distance <= ROUTING_BRIDGE_DISTANCE_METERS) {
            addEdge(idA, idB);
          }
        }
      }
    }

    return { nodes };
  }, [routingLayers]);

  const routeNodeEntries = useMemo(
    () => Array.from(routeGraph.nodes.entries()),
    [routeGraph],
  );

  const buildingOptions = useMemo<BuildingOption[]>(() => {
    const buildingLayer = geoJsonLayers.find(
      (layer) => layer.feature === "GOPHER_WAY_LEVEL_BLDGS",
    );
    if (!buildingLayer) {
      return [];
    }

    const seen = new Map<string, BuildingOption>();

    buildingLayer.featureCollection.features.forEach((feature, index) => {
      const properties = (feature.properties ?? {}) as Record<string, unknown>;

      const rawName =
        (properties.BLDG_NAME_LABEL as string | undefined) ??
        (properties.TRI_BLDG_LONG_NAME as string | undefined) ??
        (properties.TRI_LEGAL_NAME as string | undefined) ??
        (properties.TRI_BLDG_NAME as string | undefined) ??
        (properties.NAME as string | undefined) ??
        "";
      const name = rawName.trim();
      if (!name) {
        return;
      }

      const centroid = computeFeatureCentroid(
        feature.geometry as GeoJsonGeometry | null | undefined,
      );
      if (!centroid) {
        return;
      }

      const rawId =
        properties.SITE_BUILDING ??
        properties.GlobalID ??
        properties.OBJECTID ??
        `building-${index}`;
      const id = String(rawId);
      if (seen.has(id)) {
        return;
      }

      const searchTokenSet = new Set<string>();
      const exactTokenSet = new Set<string>();

      const addExactToken = (value: unknown) => {
        const normalized = normalizeToken(value);
        if (!normalized) return;
        exactTokenSet.add(normalized);
      };

      const addSearchToken = (value: unknown) => {
        const normalized = normalizeToken(value);
        if (!normalized) return;
        searchTokenSet.add(normalized);
        const cleaned = normalized.replace(/\([^)]*\)/g, "").trim();
        if (cleaned && cleaned !== normalized) {
          searchTokenSet.add(cleaned);
        }
        cleaned
          .split(/\s+/)
          .filter((part) => part.length > 2)
          .forEach((part) => searchTokenSet.add(part));
      };

      const registerNameVariant = (value: unknown) => {
        addExactToken(value);
        addSearchToken(value);
      };

      registerNameVariant(name);
      registerNameVariant(properties.BLDG_NAME_LABEL_SHORT);
      registerNameVariant(properties.TRI_BLDG_NAME);
      registerNameVariant(properties.TRI_BLDG_ABBR);
      registerNameVariant(properties.SITE_BUILDING);

      seen.set(id, {
        id,
        name,
        position: centroid,
        tokens: Array.from(searchTokenSet),
        exactTokens: Array.from(exactTokenSet),
      });
    });

    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [geoJsonLayers]);

  const buildingMap = useMemo(
    () => new Map(buildingOptions.map((option) => [option.id, option])),
    [buildingOptions],
  );

  const buildingToNearestNode = useMemo(() => {
    const map = new Map<string, string>();
    if (routeNodeEntries.length === 0) {
      return map;
    }

    buildingOptions.forEach((building) => {
      let bestId: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      routeNodeEntries.forEach(([nodeId, node]) => {
        const distance = distanceSquared(building.position, node.position);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = nodeId;
        }
      });
      if (bestId) {
        map.set(building.id, bestId);
      }
    });

    return map;
  }, [buildingOptions, routeNodeEntries]);

  const matchExactBuilding = useCallback(
    (value: string): BuildingOption | null => {
      const normalized = normalizeToken(value);
      if (!normalized) return null;
      return (
        buildingOptions.find((option) =>
          option.exactTokens.some((token) => token === normalized),
        ) ?? null
      );
    },
    [buildingOptions],
  );

  const startBuilding = startBuildingId
    ? buildingMap.get(startBuildingId) ?? null
    : null;
  const endBuilding = endBuildingId
    ? buildingMap.get(endBuildingId) ?? null
    : null;

  const computeNodeRoute = useCallback(
    (startNode: string | null, endNode: string | null): string[] => {
      if (!startNode || !endNode) {
        return [];
      }
      if (startNode === endNode) {
        return [startNode];
      }

      const nodesMap = routeGraph.nodes;
      if (!nodesMap.has(startNode) || !nodesMap.has(endNode)) {
        return [];
      }

      const distances = new Map<string, number>();
      const previous = new Map<string, string | null>();
      const queue: Array<{ id: string; distance: number }> = [];

      const enqueue = (id: string, distance: number) => {
        queue.push({ id, distance });
        queue.sort((a, b) => a.distance - b.distance);
      };

      distances.set(startNode, 0);
      previous.set(startNode, null);
      enqueue(startNode, 0);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.id === endNode) {
          break;
        }
        const node = nodesMap.get(current.id);
        if (!node) continue;
        node.neighbors.forEach((weight, neighbor) => {
          const candidate = current.distance + weight;
          if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
            distances.set(neighbor, candidate);
            previous.set(neighbor, current.id);
            enqueue(neighbor, candidate);
          }
        });
      }

      if (!previous.has(endNode)) {
        return [];
      }

      const path: string[] = [];
      let current: string | null = endNode;
      while (current) {
        path.push(current);
        current = previous.get(current) ?? null;
      }
      path.reverse();
      return path;
    },
    [routeGraph],
  );

  const routeLine = useMemo(
    () =>
      routeNodeIds
        .map((id) => routeGraph.nodes.get(id)?.position)
        .filter(
          (value): value is LatLngTuple =>
            Array.isArray(value) && value.length === 2,
        ),
    [routeNodeIds, routeGraph],
  );

  const routeSteps = useMemo(() => {
    const steps: Array<{ id: string; label: string }> = [];
    if (startBuilding) {
      steps.push({ id: startBuilding.id, label: startBuilding.name });
    }
    if (endBuilding) {
      steps.push({ id: endBuilding.id, label: endBuilding.name });
    }
    return steps;
  }, [startBuilding, endBuilding]);

  const routeAvailable = routeLine.length > 1;

  const routeSummary = useMemo(() => {
    if (!startBuildingId || !endBuildingId) {
      return "Select two locations to plan a tunnel route.";
    }
    if (!routeAttempted) {
      return "Tap find route to calculate the tunnel path.";
    }
    if (routeNodeIds.length === 0) {
      return "No tunnel connection found between the selected locations.";
    }
    if (routeNodeIds.length === 1) {
      return "You're already at your destination.";
    }
    const segmentCount = routeNodeIds.length - 1;
    if (startBuilding && endBuilding) {
      return `${startBuilding.name} → ${endBuilding.name} · ${segmentCount} segment${segmentCount === 1 ? "" : "s"}`;
    }
    return `${segmentCount} segment${segmentCount === 1 ? "" : "s"} long`;
  }, [
    startBuildingId,
    endBuildingId,
    routeAttempted,
    routeNodeIds,
    startBuilding,
    endBuilding,
  ]);

  const startSelectionReady = useMemo(
    () => matchExactBuilding(startQuery) !== null,
    [matchExactBuilding, startQuery],
  );

  const endSelectionReady = useMemo(
    () => matchExactBuilding(endQuery) !== null,
    [matchExactBuilding, endQuery],
  );

  const handleStartInputChange = useCallback((value: string) => {
    setStartQuery(value);
    setRouteAttempted(false);
  }, []);

  const handleEndInputChange = useCallback((value: string) => {
    setEndQuery(value);
    setRouteAttempted(false);
  }, []);

  const commitStartSelection = useCallback(
    (
      value: string,
      applySelection: boolean = true,
    ): BuildingOption | null => {
      const match = matchExactBuilding(value);
      if (match) {
        setStartQuery(match.name);
        if (applySelection) {
          setStartBuildingId(match.id);
        }
        return match;
      }
      if (applySelection) {
        setStartBuildingId("");
      }
      return null;
    },
    [matchExactBuilding],
  );

  const commitEndSelection = useCallback(
    (
      value: string,
      applySelection: boolean = true,
    ): BuildingOption | null => {
      const match = matchExactBuilding(value);
      if (match) {
        setEndQuery(match.name);
        if (applySelection) {
          setEndBuildingId(match.id);
        }
        return match;
      }
      if (applySelection) {
        setEndBuildingId("");
      }
      return null;
    },
    [matchExactBuilding],
  );

  const suppressMapKeyPropagation = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      const nativeEvent = event.nativeEvent as KeyboardEvent | undefined;
      nativeEvent?.stopImmediatePropagation?.();
    },
    [],
  );

  const handleStartKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      suppressMapKeyPropagation(event);
      if (event.key === "Enter") {
        event.preventDefault();
        commitStartSelection(event.currentTarget.value, false);
      }
    },
    [commitStartSelection, suppressMapKeyPropagation],
  );

  const handleEndKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      suppressMapKeyPropagation(event);
      if (event.key === "Enter") {
        event.preventDefault();
        commitEndSelection(event.currentTarget.value, false);
      }
    },
    [commitEndSelection, suppressMapKeyPropagation],
  );

  const handleStartBlur = useCallback(
    (event: ReactFocusEvent<HTMLInputElement>) => {
      commitStartSelection(event.currentTarget.value, false);
    },
    [commitStartSelection],
  );

  const handleEndBlur = useCallback(
    (event: ReactFocusEvent<HTMLInputElement>) => {
      commitEndSelection(event.currentTarget.value, false);
    },
    [commitEndSelection],
  );

  const handleFindRoute = useCallback(() => {
    const startOption = commitStartSelection(startQuery);
    const endOption = commitEndSelection(endQuery);
    if (!startOption || !endOption) {
      setRouteNodeIds([]);
      setRouteAttempted(true);
      return;
    }
    const startNode = buildingToNearestNode.get(startOption.id) ?? null;
    const endNode = buildingToNearestNode.get(endOption.id) ?? null;
    const route = computeNodeRoute(startNode, endNode);
    setRouteNodeIds(route);
    setRouteAttempted(true);
    if (route.length > 0) {
      setFitBoundsSequence((value) => value + 1);
    }
  }, [
    buildingToNearestNode,
    commitEndSelection,
    commitStartSelection,
    computeNodeRoute,
    endQuery,
    startQuery,
  ]);

  const handleClear = useCallback(() => {
    setStartBuildingId("");
    setEndBuildingId("");
    setStartQuery("");
    setEndQuery("");
    setRouteNodeIds([]);
    setRouteAttempted(false);
  }, []);

  return (
    <div className="app-shell">
      <div className="workspace">
        <aside className="side-panel">
          <section className="panel-section">
            <h3>Plan a route</h3>
            <div className="route-form">
              <label className="route-field">
                <span>Start</span>
                <input
                  type="text"
                  value={startQuery}
                  onChange={(event) => handleStartInputChange(event.target.value)}
                  onKeyDown={handleStartKeyDown}
                  onBlur={handleStartBlur}
                  placeholder="Search building"
                  autoComplete="off"
                  list="building-options-list"
                />
              </label>
              <label className="route-field">
                <span>Destination</span>
                <input
                  type="text"
                  value={endQuery}
                  onChange={(event) => handleEndInputChange(event.target.value)}
                  onKeyDown={handleEndKeyDown}
                  onBlur={handleEndBlur}
                  placeholder="Search building"
                  autoComplete="off"
                  list="building-options-list"
                />
              </label>
              <div className="route-actions">
                <button
                  type="button"
                  className="layer-toggle"
                  onClick={handleFindRoute}
                  disabled={!startSelectionReady || !endSelectionReady}
                >
                  Find route
                </button>
                <button
                  type="button"
                  className="layer-toggle"
                  onClick={handleClear}
                  disabled={
                    !startBuildingId &&
                    !endBuildingId &&
                    startQuery === "" &&
                    endQuery === "" &&
                    routeNodeIds.length === 0
                  }
                >
                  Clear
                </button>
              </div>
              <p className="route-summary">{routeSummary}</p>
            </div>
            <datalist id="building-options-list">
              {buildingOptions.map((option) => (
                <option key={option.id} value={option.name} />
              ))}
            </datalist>
          </section>
        </aside>

        <main className="map-area">
          <div className="map-canvas">
            <MapView
              routeLine={routeLine}
              geoJsonLayers={geoJsonLayers}
              startMarker={startBuilding?.position ?? null}
              endMarker={endBuilding?.position ?? null}
              fitBoundsSequence={fitBoundsSequence}
            />

            <div className="floating-card directions-card">
              <header>
                <strong>Route preview</strong>
                {routeAvailable && (
                  <span className="badge badge-live">
                    {routeNodeIds.length - 1} segment
                    {routeNodeIds.length - 1 === 1 ? "" : "s"}
                  </span>
                )}
              </header>
              {routeSteps.length > 0 ? (
                <ol>
                  {routeSteps.map((step, index) => (
                    <li key={step.id}>
                      <span className="step-index">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {step.label}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>
                  {routeAttempted && startBuilding && endBuilding
                    ? "No tunnel connection found between the selected locations."
                    : "Select a start and destination to preview a tunnel route."}
                </p>
              )}
            </div>

            <div className="map-attribution">
              Unofficial visualization. Not for outdoor navigation.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
