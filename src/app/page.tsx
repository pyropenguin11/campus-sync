'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MapView } from "@/components/map-view";
import { normalizeToken } from "@/lib/map-data";
import type { ArcgisGeoJsonLayer } from "@/types/arcgis";
import type { BuildingSummary, RouteGraphSnapshot } from "@/types/map-data";
import type { LatLngTuple } from "@/types/tunnels";
import { api } from "@/trpc/client";

type BuildingOption = BuildingSummary;

type RouteMode = "tunnel" | "surface";

type RouteGraphNode = {
  position: LatLngTuple;
  neighbors: Map<string, number>;
};

type RouteGraph = {
  nodes: Map<string, RouteGraphNode>;
};

const buildRouteGraph = (
  snapshot: RouteGraphSnapshot | null | undefined,
): RouteGraph => {
  const nodes = new Map<string, RouteGraphNode>();
  if (!snapshot) {
    return { nodes };
  }
  snapshot.nodes.forEach((node) => {
    nodes.set(node.id, {
      position: node.position,
      neighbors: new Map(node.neighbors.map((neighbor) => [neighbor.id, neighbor.weight])),
    });
  });
  return { nodes };
};

const buildBuildingNodeMap = (
  snapshot: RouteGraphSnapshot | null | undefined,
): Map<string, string> => {
  const mapping = new Map<string, string>();
  if (!snapshot) {
    return mapping;
  }
  Object.entries(snapshot.buildingToNearestNode).forEach(
    ([buildingId, nodeId]) => {
      if (nodeId) {
        mapping.set(buildingId, nodeId);
      }
    },
  );
  return mapping;
};

const computeNodeRoute = (
  graph: RouteGraph,
  startNode: string | null,
  endNode: string | null,
): string[] => {
  if (!startNode || !endNode || startNode.length === 0 || endNode.length === 0) {
    return [];
  }

  const nodesMap = graph.nodes;
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
};

export default function HomePage() {
  const utils = api.useUtils();
  const { data: layerMetadata } = api.arcgis.layerMetadata.useQuery();
  const { data: buildingOptionsData } = api.arcgis.buildings.useQuery();
  const { data: routeGraphBundle } = api.arcgis.routeGraph.useQuery();
  const [geoJsonLayers, setGeoJsonLayers] = useState<ArcgisGeoJsonLayer[]>([]);
  const loadedLayerKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!layerMetadata || layerMetadata.length === 0) {
      return;
    }
    let isCancelled = false;

    const loadLayers = async () => {
      for (const meta of layerMetadata) {
        if (isCancelled) {
          break;
        }
        const key = `${meta.feature}-${meta.layerId}`;
        if (loadedLayerKeysRef.current.has(key)) {
          continue;
        }
        try {
          const layer = await utils.arcgis.layer.fetch({
            feature: meta.feature,
            layerId: meta.layerId,
          });
          if (!layer || isCancelled) {
            continue;
          }
          loadedLayerKeysRef.current.add(key);
          setGeoJsonLayers((previous) => {
            if (
              previous.some(
                (existing) =>
                  existing.feature === layer.feature &&
                  existing.layerId === layer.layerId,
              )
            ) {
              return previous;
            }
            return [...previous, layer];
          });
        } catch (error) {
          console.error("Failed to load layer", meta, error);
        }
      }
    };

    void loadLayers();

    return () => {
      isCancelled = true;
    };
  }, [layerMetadata, utils]);

  const buildingOptions = buildingOptionsData ?? [];

  const [startBuildingId, setStartBuildingId] = useState<string>("");
  const [endBuildingId, setEndBuildingId] = useState<string>("");
  const [startQuery, setStartQuery] = useState<string>("");
  const [endQuery, setEndQuery] = useState<string>("");
  const [routeNodeIds, setRouteNodeIds] = useState<string[]>([]);
  const [routeMode, setRouteMode] = useState<RouteMode | null>(null);
  const [fitBoundsSequence, setFitBoundsSequence] = useState(0);
  const [routeAttempted, setRouteAttempted] = useState(false);

  const tunnelRouteGraph = useMemo(
    () => buildRouteGraph(routeGraphBundle?.tunnel),
    [routeGraphBundle],
  );

  const fullRouteGraph = useMemo(
    () => buildRouteGraph(routeGraphBundle?.full),
    [routeGraphBundle],
  );

  const tunnelBuildingToNode = useMemo(
    () => buildBuildingNodeMap(routeGraphBundle?.tunnel),
    [routeGraphBundle],
  );

  const fullBuildingToNode = useMemo(
    () => buildBuildingNodeMap(routeGraphBundle?.full),
    [routeGraphBundle],
  );

  const buildingMap = useMemo(
    () => new Map(buildingOptions.map((option) => [option.id, option])),
    [buildingOptions],
  );

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

  const activeRouteGraph =
    routeMode === "surface" ? fullRouteGraph : tunnelRouteGraph;

  const routeLine = useMemo(
    () =>
      routeNodeIds
        .map((id) => activeRouteGraph.nodes.get(id)?.position)
        .filter(
          (value): value is LatLngTuple =>
            Array.isArray(value) && value.length === 2,
        ),
    [routeNodeIds, activeRouteGraph],
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

  const startMarkerPosition = useMemo(() => {
    if (routeLine.length > 0) {
      return routeLine[0];
    }
    return startBuilding?.position ?? null;
  }, [routeLine, startBuilding]);

  const endMarkerPosition = useMemo(() => {
    if (routeLine.length > 0) {
      return routeLine[routeLine.length - 1];
    }
    return endBuilding?.position ?? null;
  }, [endBuilding, routeLine]);

  const routeSummary = useMemo(() => {
    if (!startBuildingId || !endBuildingId) {
      return "Select two locations to plan a tunnel route.";
    }
    if (!routeAttempted) {
      return "Tap find route to calculate the tunnel path.";
    }
    if (routeNodeIds.length === 0) {
      return "No tunnel or alternate connection found between the selected locations.";
    }
    if (routeNodeIds.length === 1) {
      return "You're already at your destination.";
    }
    const segmentCount = routeNodeIds.length - 1;
    const baseLabel =
      startBuilding && endBuilding
        ? `${startBuilding.name} → ${endBuilding.name} · ${segmentCount} segment${segmentCount === 1 ? "" : "s"}`
        : `${segmentCount} segment${segmentCount === 1 ? "" : "s"} long`;
    if (routeMode === "surface") {
      return `${baseLabel} (includes non-tunnel paths)`;
    }
    return baseLabel;
  }, [
    startBuildingId,
    endBuildingId,
    routeAttempted,
    routeNodeIds,
    startBuilding,
    endBuilding,
    routeMode,
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
      setRouteMode(null);
      setRouteAttempted(true);
      return;
    }
    let nextRoute: string[] = [];
    let nextMode: RouteMode | null = null;

    const startTunnelNode = tunnelBuildingToNode.get(startOption.id) ?? null;
    const endTunnelNode = tunnelBuildingToNode.get(endOption.id) ?? null;
    if (startTunnelNode && endTunnelNode) {
      nextRoute = computeNodeRoute(
        tunnelRouteGraph,
        startTunnelNode,
        endTunnelNode,
      );
      if (nextRoute.length > 0) {
        nextMode = "tunnel";
      }
    }

    if (nextRoute.length === 0) {
      const startFullNode = fullBuildingToNode.get(startOption.id) ?? null;
      const endFullNode = fullBuildingToNode.get(endOption.id) ?? null;
      if (startFullNode && endFullNode) {
        nextRoute = computeNodeRoute(
          fullRouteGraph,
          startFullNode,
          endFullNode,
        );
        if (nextRoute.length > 0) {
          nextMode = "surface";
        }
      }
    }

    setRouteNodeIds(nextRoute);
    setRouteMode(nextMode);
    setRouteAttempted(true);
    if (nextRoute.length > 0) {
      setFitBoundsSequence((value) => value + 1);
    }
  }, [
    commitEndSelection,
    commitStartSelection,
    endQuery,
    fullBuildingToNode,
    fullRouteGraph,
    startQuery,
    tunnelBuildingToNode,
    tunnelRouteGraph,
  ]);

  const handleClear = useCallback(() => {
    setStartBuildingId("");
    setEndBuildingId("");
    setStartQuery("");
    setEndQuery("");
    setRouteNodeIds([]);
    setRouteMode(null);
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
              startMarker={startMarkerPosition}
              endMarker={endMarkerPosition}
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
                    ? "No tunnel or alternate connection found between the selected locations."
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
