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
  const { data } = api.tunnels.mapData.useQuery();
  const { data: arcgisData } = api.arcgis.mapData.useQuery();

  const nodes = data?.nodes ?? [];
  const segments = data?.segments ?? [];
  const geoJsonLayers = arcgisData?.layers ?? [];

  const [startBuildingId, setStartBuildingId] = useState<string>("");
  const [endBuildingId, setEndBuildingId] = useState<string>("");
  const [startQuery, setStartQuery] = useState<string>("");
  const [endQuery, setEndQuery] = useState<string>("");
  const [routeNodeIds, setRouteNodeIds] = useState<string[]>([]);
  const [routeAttempted, setRouteAttempted] = useState(false);

  const nodeLookup = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((node) => {
      map.set(node.id, new Set<string>());
    });
    segments.forEach(([from, to]) => {
      map.get(from)?.add(to);
      map.get(to)?.add(from);
    });
    return map;
  }, [nodes, segments]);

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
    if (nodes.length === 0) {
      return map;
    }

    buildingOptions.forEach((building) => {
      let bestId: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      nodes.forEach((node) => {
        const distance = distanceSquared(building.position, node.position);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = node.id;
        }
      });
      if (bestId) {
        map.set(building.id, bestId);
      }
    });

    return map;
  }, [buildingOptions, nodes]);

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
      if (!adjacency.has(startNode) || !adjacency.has(endNode)) {
        return [];
      }
      if (startNode === endNode) {
        return [startNode];
      }

      const queue = [startNode];
      const visited = new Set<string>([startNode]);
      const parent = new Map<string, string | null>();
      parent.set(startNode, null);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === endNode) {
          break;
        }
        const neighbors = adjacency.get(current);
        if (!neighbors) continue;
        neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            parent.set(neighbor, current);
            queue.push(neighbor);
          }
        });
      }

      if (!visited.has(endNode)) {
        return [];
      }

      const path: string[] = [];
      let current: string | null = endNode;
      while (current) {
        path.push(current);
        current = parent.get(current) ?? null;
      }
      path.reverse();
      return path;
    },
    [adjacency],
  );

  const routePoints = useMemo(
    () =>
      routeNodeIds
        .map((id) => nodeLookup.get(id)?.position)
        .filter(
          (value): value is LatLngTuple =>
            Array.isArray(value) && value.length === 2,
        ),
    [routeNodeIds, nodeLookup],
  );

  const routeSteps = useMemo(() => {
    if (routeNodeIds.length === 0) {
      return [] as Array<{ id: string; label: string }>;
    }
    return routeNodeIds.map((nodeId, index) => {
      let label = nodeLookup.get(nodeId)?.name ?? nodeId;
      if (index === 0 && startBuilding) {
        label = startBuilding.name;
      } else if (index === routeNodeIds.length - 1 && endBuilding) {
        label = endBuilding.name;
      }
      return { id: nodeId, label };
    });
  }, [routeNodeIds, nodeLookup, startBuilding, endBuilding]);

  const routeAvailable = routeNodeIds.length > 1;

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
                {startSuggestions.length > 0 && (
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
                {endSuggestions.length > 0 && (
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
              routePoints={routePoints}
              nodes={nodes}
              geoJsonLayers={geoJsonLayers}
              routeNodeIds={routeNodeIds}
              startNodeId={startNodeId}
              endNodeId={endNodeId}
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
                  {routeAttempted && startBuildingId && endBuildingId
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
