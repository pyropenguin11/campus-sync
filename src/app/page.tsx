'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapView } from "@/components/map-view";
import { NODE_TYPE_LABEL } from "@/constants/tunnels";
import type { GeoJsonGeometry } from "@/types/geojson";
import type { LatLngTuple } from "@/types/tunnels";
import { api } from "@/trpc/client";

type BuildingOption = {
  id: string;
  name: string;
  position: LatLngTuple;
  tokens: string[];
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
  const [routeAttempted, setRouteAttempted] = useState(false);

  const routeLayer = useMemo(
    () =>
      geoJsonLayers.find(
        (layer) => layer.feature === "GW_ROUTE",
      ) ?? null,
    [geoJsonLayers],
  );

  type RouteGraphNode = {
    position: LatLngTuple;
    neighbors: Map<string, number>;
  };

  const routeGraph = useMemo(() => {
    const nodes = new Map<string, RouteGraphNode>();
    if (!routeLayer) {
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

    routeLayer.featureCollection.features.forEach((feature) => {
      walkGeometry(feature.geometry as GeoJsonGeometry | null | undefined);
    });

    return { nodes };
  }, [routeLayer]);

  const routeNodeEntries = useMemo(
    () => Array.from(routeGraph.nodes.entries()),
    [routeGraph],
  );

  const buildingOptions = useMemo<BuildingOption[]>(() => {
    const buildingLayer = geoJsonLayers.find(
      (layer) => layer.feature === "EGISADMIN_BUILDING_POLYGON_HOSTED",
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

      const tokenSet = new Set<string>();
      const addToken = (value: unknown) => {
        const normalized = normalizeToken(value);
        if (!normalized) return;
        tokenSet.add(normalized);
        const cleaned = normalized.replace(/\([^)]*\)/g, "").trim();
        if (cleaned && cleaned !== normalized) {
          tokenSet.add(cleaned);
        }
        cleaned
          .split(/\s+/)
          .filter((part) => part.length > 2)
          .forEach((part) => tokenSet.add(part));
      };

      addToken(name);
      addToken(properties.BLDG_NAME_LABEL_SHORT);
      addToken(properties.TRI_BLDG_NAME);
      addToken(properties.TRI_BLDG_ABBR);
      addToken(properties.SITE_BUILDING);

      seen.set(id, {
        id,
        name,
        position: centroid,
        tokens: Array.from(tokenSet),
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
          option.tokens.some((token) => token === normalized),
        ) ?? null
      );
    },
    [buildingOptions],
  );

  const filterOptions = useCallback(
    (query: string) => {
      if (buildingOptions.length === 0) {
        return [] as BuildingOption[];
      }
      const normalized = normalizeToken(query);
      if (!normalized) {
        return buildingOptions.slice(0, 12);
      }
      return buildingOptions
        .filter((option) =>
          option.tokens.some((token) => token.includes(normalized)),
        )
        .slice(0, 12);
    },
    [buildingOptions],
  );

  const startBuilding = startBuildingId
    ? buildingMap.get(startBuildingId) ?? null
    : null;
  const endBuilding = endBuildingId
    ? buildingMap.get(endBuildingId) ?? null
    : null;

  const startNodeId = startBuildingId
    ? buildingToNearestNode.get(startBuildingId) ?? null
    : null;
  const endNodeId = endBuildingId
    ? buildingToNearestNode.get(endBuildingId) ?? null
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

  const startSuggestions = useMemo(
    () => filterOptions(startQuery),
    [filterOptions, startQuery],
  );
  const endSuggestions = useMemo(
    () => filterOptions(endQuery),
    [filterOptions, endQuery],
  );

  const normalizedStartQuery = normalizeToken(startQuery);
  const normalizedEndQuery = normalizeToken(endQuery);

  const showStartSuggestions =
    normalizedStartQuery !== null &&
    (!startBuilding || normalizeToken(startBuilding.name) !== normalizedStartQuery);

  const showEndSuggestions =
    normalizedEndQuery !== null &&
    (!endBuilding || normalizeToken(endBuilding.name) !== normalizedEndQuery);

  const handleStartInputChange = useCallback(
    (value: string) => {
      setStartQuery(value);
      const match = matchExactBuilding(value);
      if (match) {
        setStartBuildingId(match.id);
        setRouteNodeIds([]);
        setRouteAttempted(false);
      } else {
        setStartBuildingId("");
      }
    },
    [matchExactBuilding],
  );

  const handleEndInputChange = useCallback(
    (value: string) => {
      setEndQuery(value);
      const match = matchExactBuilding(value);
      if (match) {
        setEndBuildingId(match.id);
        setRouteNodeIds([]);
        setRouteAttempted(false);
      } else {
        setEndBuildingId("");
      }
    },
    [matchExactBuilding],
  );

  const handleStartSuggestionSelect = useCallback((option: BuildingOption) => {
    setStartBuildingId(option.id);
    setStartQuery(option.name);
    setRouteNodeIds([]);
    setRouteAttempted(false);
  }, []);

  const handleEndSuggestionSelect = useCallback((option: BuildingOption) => {
    setEndBuildingId(option.id);
    setEndQuery(option.name);
    setRouteNodeIds([]);
    setRouteAttempted(false);
  }, []);

  const handleFindRoute = useCallback(() => {
    const route = computeNodeRoute(startNodeId, endNodeId);
    setRouteNodeIds(route);
    setRouteAttempted(true);
  }, [computeNodeRoute, startNodeId, endNodeId]);

  const handleClear = useCallback(() => {
    setStartBuildingId("");
    setEndBuildingId("");
    setStartQuery("");
    setEndQuery("");
    setRouteNodeIds([]);
    setRouteAttempted(false);
  }, []);

  const popularRoutes = useMemo(() => {
    const presets = [
      {
        label: "Northrop → Coffman Union",
        startTokens: ["northrop"],
        endTokens: ["coffman"],
      },
      {
        label: "Walter Library → Keller Hall",
        startTokens: ["walter"],
        endTokens: ["keller"],
      },
      {
        label: "STSS → Peik Hall",
        startTokens: ["stss", "science teaching"],
        endTokens: ["peik"],
      },
    ];

    return presets
      .map((preset) => {
        const startOption = buildingOptions.find((option) =>
          preset.startTokens.some((token) =>
            option.tokens.some((value) => value.includes(token)),
          ),
        );
        const endOption = buildingOptions.find((option) =>
          preset.endTokens.some((token) =>
            option.tokens.some((value) => value.includes(token)),
          ),
        );
        if (!startOption || !endOption) {
          return null;
        }
        return {
          label: preset.label,
          startId: startOption.id,
          endId: endOption.id,
        };
      })
      .filter(Boolean) as Array<{
      label: string;
      startId: string;
      endId: string;
    }>;
  }, [buildingOptions]);

  const handlePopularSelect = useCallback(
    (startId: string, endId: string) => {
      const startOption = buildingMap.get(startId);
      const endOption = buildingMap.get(endId);
      if (!startOption || !endOption) {
        return;
      }
      setStartBuildingId(startId);
      setEndBuildingId(endId);
      setStartQuery(startOption.name);
      setEndQuery(endOption.name);
      const route = computeNodeRoute(
        buildingToNearestNode.get(startId) ?? null,
        buildingToNearestNode.get(endId) ?? null,
      );
      setRouteNodeIds(route);
      setRouteAttempted(true);
    },
    [buildingMap, computeNodeRoute, buildingToNearestNode],
  );

  useEffect(() => {
    if (!startBuildingId) return;
    const option = buildingMap.get(startBuildingId);
    if (option) {
      setStartQuery(option.name);
    }
  }, [startBuildingId, buildingMap]);

  useEffect(() => {
    if (!endBuildingId) return;
    const option = buildingMap.get(endBuildingId);
    if (option) {
      setEndQuery(option.name);
    }
  }, [endBuildingId, buildingMap]);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            CS
          </span>
          <div>
            <strong>Campus Sync</strong>
            <span className="brand-subtitle">UMN Tunnel Explorer</span>
          </div>
        </div>
        <div className="search-bar" role="search">
          <input
            type="text"
            placeholder="Search buildings, tunnels, or dining"
            aria-label="Search campus map"
          />
          <button type="button">Search</button>
        </div>
        <div className="header-actions">
          <button type="button" className="icon-button" aria-label="Map layers">
            ⊞
          </button>
          <button type="button" className="icon-button" aria-label="Settings">
            ☰
          </button>
          <div className="avatar" aria-hidden="true">
            NK
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="side-panel">
          <section className="panel-section">
            <h2>Explore tunnels</h2>
            <p>
              Toggle layers and highlights to plan your trip through the Gopher
              Way tunnel network.
            </p>
            <div className="layer-options">
              <button className="layer-toggle active" type="button">
                <span className="status-dot open" aria-hidden="true" />
                Open tunnels
              </button>
              <button className="layer-toggle" type="button">
                <span className="status-dot limited" aria-hidden="true" />
                Limited access
              </button>
              <button className="layer-toggle" type="button">
                <span className="status-dot construction" aria-hidden="true" />
                Construction updates
              </button>
            </div>
          </section>

          <section className="panel-section">
            <h3>Plan a route</h3>
            <div className="route-form">
              <label className="route-field">
                <span>Start</span>
                <input
                  type="text"
                  value={startQuery}
                  onChange={(event) => handleStartInputChange(event.target.value)}
                  placeholder="Search building"
                  autoComplete="off"
                  list="building-options-list"
                />
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <ul className="route-suggestions">
                    {startSuggestions.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => handleStartSuggestionSelect(option)}
                        >
                          {option.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label className="route-field">
                <span>Destination</span>
                <input
                  type="text"
                  value={endQuery}
                  onChange={(event) => handleEndInputChange(event.target.value)}
                  placeholder="Search building"
                  autoComplete="off"
                  list="building-options-list"
                />
                {showEndSuggestions && endSuggestions.length > 0 && (
                  <ul className="route-suggestions">
                    {endSuggestions.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => handleEndSuggestionSelect(option)}
                        >
                          {option.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <div className="route-actions">
                <button
                  type="button"
                  className="layer-toggle"
                  onClick={handleFindRoute}
                  disabled={!startBuildingId || !endBuildingId}
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

          <section className="panel-section">
            <h3>Popular connections</h3>
            <ul className="popular-list">
              {popularRoutes.map((route, index) => (
                <li key={`${route.startId}-${route.endId}`}>
                  <button
                    type="button"
                    className="layer-toggle"
                    onClick={() =>
                      handlePopularSelect(route.startId, route.endId)
                    }
                  >
                    <span className="node-badge">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {route.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-section tunnel-legend">
            <h3>Segment legend</h3>
            <ul>
              <li>
                <span className="legend-line open" aria-hidden="true" />
                Open underground connector
              </li>
              <li>
                <span className="legend-line detour" aria-hidden="true" />
                Winter route detour
              </li>
              <li>
                <span className="legend-dot academic" aria-hidden="true" />
                {NODE_TYPE_LABEL.academic}
              </li>
              <li>
                <span className="legend-dot student" aria-hidden="true" />
                {NODE_TYPE_LABEL.student}
              </li>
              <li>
                <span className="legend-dot research" aria-hidden="true" />
                {NODE_TYPE_LABEL.research}
              </li>
            </ul>
          </section>
        </aside>

        <main className="map-area">
          <div className="map-canvas">
            <MapView
              routeLine={routeLine}
              geoJsonLayers={geoJsonLayers}
              startMarker={startBuilding?.position ?? null}
              endMarker={endBuilding?.position ?? null}
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

            <div className="floating-card status-card">
              <strong>Status</strong>
              <p>
                Heating plant passage open until 11:30&nbsp;PM. Expect
                increased traffic near Coffman due to event setup.
              </p>
            </div>

            <div className="floating-card layer-card">
              <strong>Layers</strong>
              <ul>
                <li>
                  <span className="layer-dot open" />
                  Winter walkways
                </li>
                <li>
                  <span className="layer-dot limited" />
                  Accessible routes
                </li>
                <li>
                  <span className="layer-dot detour" />
                  Maintenance alerts
                </li>
              </ul>
            </div>

            <div className="scale-indicator" aria-hidden="true">
              <div className="scale-bar" />
              200 ft
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
