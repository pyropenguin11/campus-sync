import { ROUTING_BRIDGE_DISTANCE_METERS } from "../../constants/routing";
import {
  computeFeatureCentroid,
  distanceSquared,
  normalizeToken,
} from "../../lib/map-data";
import type { ArcgisGeoJsonLayer } from "../../types/arcgis";
import type { GeoJsonGeometry } from "../../types/geojson";
import type {
  BuildingSummary,
  LayerMetadata,
  RouteGraphNodeSnapshot,
  RouteGraphSnapshot,
} from "../../types/map-data";
import type { LatLngTuple } from "../../types/tunnels";

type RouteGraphNode = {
  position: LatLngTuple;
  neighbors: Map<string, number>;
};

type BuildingSource = "primary" | "egis";

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

const serializeRouteGraph = (
  nodes: Map<string, RouteGraphNode>,
): RouteGraphNodeSnapshot[] =>
  Array.from(nodes.entries()).map(([id, node]) => ({
    id,
    position: node.position,
    neighbors: Array.from(node.neighbors.entries()).map(
      ([neighborId, weight]) => ({
        id: neighborId,
        weight,
      }),
    ),
  }));

const mapBuildingsToNearestNodes = (
  buildings: BuildingSummary[],
  routeNodes: Map<string, RouteGraphNode>,
): Record<string, string> => {
  const entries = Array.from(routeNodes.entries());
  if (entries.length === 0) {
    return {};
  }
  const mapping: Record<string, string> = {};

  buildings.forEach((building) => {
    let bestId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    entries.forEach(([nodeId, node]) => {
      const candidate = distanceSquared(building.position, node.position);
      if (candidate < bestDistance) {
        bestDistance = candidate;
        bestId = nodeId;
      }
    });
    if (bestId) {
      mapping[building.id] = bestId;
    }
  });

  return mapping;
};

const addBuildingEntrancesToRouteNodes = (
  buildings: BuildingSummary[],
  baseRouteNodes: Map<string, RouteGraphNode>,
  options?: { maxDistanceMeters?: number },
): { nodes: Map<string, RouteGraphNode>; buildingToNearestNode: Record<string, string> } => {
  const nodes = new Map<string, RouteGraphNode>(baseRouteNodes);
  const buildingToNearestNode: Record<string, string> = {};

  if (baseRouteNodes.size === 0) {
    return { nodes, buildingToNearestNode };
  }

  const baseEntries = Array.from(baseRouteNodes.entries());
  const maxDistanceMeters = options?.maxDistanceMeters ?? Number.POSITIVE_INFINITY;

  buildings.forEach((building) => {
    let bestId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    baseEntries.forEach(([nodeId, node]) => {
      const candidate = haversineDistance(building.position, node.position);
      if (candidate < bestDistance) {
        bestDistance = candidate;
        bestId = nodeId;
      }
    });

    if (!bestId) {
      return;
    }

    if (bestDistance > maxDistanceMeters) {
      return;
    }

    const buildingNodeId = `building:${building.id}`;
    const buildingNode: RouteGraphNode = {
      position: building.position,
      neighbors: new Map([[bestId, bestDistance]]),
    };
    nodes.set(buildingNodeId, buildingNode);

    const neighbor = nodes.get(bestId);
    if (neighbor) {
      const current = neighbor.neighbors.get(buildingNodeId);
      if (!current || bestDistance < current) {
        neighbor.neighbors.set(buildingNodeId, bestDistance);
      }
    }

    buildingToNearestNode[building.id] = buildingNodeId;
  });

  return { nodes, buildingToNearestNode };
};

const geometryMatches = (
  geometry: GeoJsonGeometry | null | undefined,
  predicate: (type: GeoJsonGeometry["type"]) => boolean,
): boolean => {
  if (!geometry) return false;
  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.some((child) => geometryMatches(child, predicate));
  }
  return predicate(geometry.type);
};

export const createRouteGraphNodes = (
  layers: ArcgisGeoJsonLayer[],
): Map<string, RouteGraphNode> => {
  const nodes = new Map<string, RouteGraphNode>();
  if (layers.length === 0) {
    return nodes;
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

  layers.forEach((layer) => {
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

  return nodes;
};

export const buildRouteGraphSnapshot = (
  buildings: BuildingSummary[],
  routeNodes: Map<string, RouteGraphNode>,
  options?: {
    maxBuildingLinkDistanceMeters?: number;
    fallbackToNearestNode?: boolean;
  },
): RouteGraphSnapshot => {
  const fallbackToNearestNode = options?.fallbackToNearestNode ?? true;
  const baseMapping = fallbackToNearestNode
    ? mapBuildingsToNearestNodes(buildings, routeNodes)
    : {};
  const { nodes, buildingToNearestNode } = addBuildingEntrancesToRouteNodes(
    buildings,
    routeNodes,
    { maxDistanceMeters: options?.maxBuildingLinkDistanceMeters },
  );

  return {
    nodes: serializeRouteGraph(nodes),
    buildingToNearestNode:
      Object.keys(buildingToNearestNode).length > 0
        ? { ...baseMapping, ...buildingToNearestNode }
        : baseMapping,
  };
};

export const buildBuildingSummaries = (
  layers: ArcgisGeoJsonLayer[],
): BuildingSummary[] => {
  const normalizeId = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text || null;
  };

  const normalizeFloorAwareId = (value: unknown): string | null => {
    const normalized = normalizeId(value);
    if (!normalized) return null;
    const parts = normalized.split("-");
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    return normalized;
  };

  const resolveName = (properties: Record<string, unknown>): string | null => {
    const rawName =
      (properties.BLDG_NAME_LABEL as string | undefined) ??
      (properties.TRI_BLDG_LONG_NAME as string | undefined) ??
      (properties.TRI_LEGAL_NAME as string | undefined) ??
      (properties.TRI_BLDG_NAME as string | undefined) ??
      (properties.NAME as string | undefined) ??
      "";
    const name = rawName.trim();
    return name || null;
  };

  const seen = new Map<string, BuildingSummary>();
  const seenBuildingCodes = new Set<string>();
  const seenNames = new Set<string>();
  const buildingByName = new Map<string, { source: BuildingSource; id: string }>();
  const buildingByCode = new Map<string, { source: BuildingSource; id: string }>();

  type IdResolver = (
    properties: Record<string, unknown>,
    index: number,
  ) => string | null;

  const buildingCodeFor = (properties: Record<string, unknown>): string | null =>
    normalizeFloorAwareId(
      properties.SITE_BUILDING_FLOOR ??
        properties.SITE_BUILDING ??
        properties.GlobalID ??
        properties.OBJECTID,
    );

  const registerLayerBuildings = (
    layer: ArcgisGeoJsonLayer | undefined,
    resolveId: IdResolver,
    { source }: { source: BuildingSource },
  ) => {
    if (!layer) return;
    layer.featureCollection.features.forEach((feature, index) => {
      const properties = (feature.properties ?? {}) as Record<string, unknown>;
      const name = resolveName(properties);
      if (!name) {
        return;
      }

      const centroid = computeFeatureCentroid(
        feature.geometry as GeoJsonGeometry | null | undefined,
      );
      if (!centroid) {
        return;
      }

      const buildingCode = buildingCodeFor(properties);
      const normalizedName = normalizeToken(name);
      const existingByName = normalizedName
        ? buildingByName.get(normalizedName)
        : null;
      const existingByCode = buildingCode
        ? buildingByCode.get(buildingCode)
        : null;

      if (
        source === "egis" &&
        ((existingByName && existingByName.source === "primary") ||
          (existingByCode && existingByCode.source === "primary"))
      ) {
        return;
      }

      if (
        (existingByName && existingByName.source === source) ||
        (existingByCode && existingByCode.source === source)
      ) {
        return;
      }

      const resolvedId =
        resolveId(properties, index) ??
        `building-${layer.feature}-${index.toString()}`;
      const id = normalizeId(resolvedId);
      if (!id || seen.has(id)) {
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
      registerNameVariant(properties.SITE_BUILDING_FLOOR);

      if (buildingCode) {
        seenBuildingCodes.add(buildingCode);
        buildingByCode.set(buildingCode, { source, id });
      }
      if (normalizedName) {
        seenNames.add(normalizedName);
        buildingByName.set(normalizedName, { source, id });
      }

      seen.set(id, {
        id,
        name,
        position: centroid,
        tokens: Array.from(searchTokenSet),
        exactTokens: Array.from(exactTokenSet),
      });
    });
  };

  const gopherWayLayer = layers.find(
    (layer) => layer.feature === "GOPHER_WAY_LEVEL_BLDGS",
  );
  const gwPortionLayer = layers.find(
    (layer) => layer.feature === "GW_PORTION_DIFFERENT_LEVEL",
  );
  const egisBuildingLayer = layers.find(
    (layer) => layer.feature === "EGISADMIN_BUILDING_POLYGON_HOSTED",
  );

  registerLayerBuildings(gopherWayLayer, (properties, index) =>
    normalizeId(
      properties.SITE_BUILDING ??
        properties.GlobalID ??
        properties.OBJECTID ??
        `building-${index.toString()}`,
    ),
    { source: "primary" },
  );

  registerLayerBuildings(gwPortionLayer, (properties, index) =>
    normalizeFloorAwareId(
      properties.SITE_BUILDING_FLOOR ??
        properties.SITE_BUILDING ??
        properties.GlobalID ??
        properties.OBJECTID ??
        `gw-portion-${index.toString()}`,
    ),
    { source: "primary" },
  );

  registerLayerBuildings(egisBuildingLayer, (properties, index) =>
    normalizeId(
      properties.SITE_BUILDING ??
        properties.GlobalID ??
        properties.OBJECTID ??
        `egis-building-${index.toString()}`,
    ),
    { source: "egis" },
  );

  return Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export const computeLayerMetadata = (
  layers: ArcgisGeoJsonLayer[],
): LayerMetadata[] =>
  layers.map((layer) => {
    let minLat = Number.POSITIVE_INFINITY;
    let minLon = Number.POSITIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    let maxLon = Number.NEGATIVE_INFINITY;

    const recordPoint = (lon: number, lat: number) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return;
      }
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    };

    const walkGeometry = (geometry: GeoJsonGeometry | null | undefined) => {
      if (!geometry) return;
      switch (geometry.type) {
        case "Point":
          recordPoint(geometry.coordinates[0], geometry.coordinates[1]);
          break;
        case "MultiPoint":
        case "LineString":
          geometry.coordinates.forEach(([lon, lat]) => recordPoint(lon, lat));
          break;
        case "MultiLineString":
        case "Polygon":
          geometry.coordinates.forEach((segment) =>
            segment.forEach(([lon, lat]) => recordPoint(lon, lat)),
          );
          break;
        case "MultiPolygon":
          geometry.coordinates.forEach((polygon) =>
            polygon.forEach((ring) =>
              ring.forEach(([lon, lat]) => recordPoint(lon, lat)),
            ),
          );
          break;
        case "GeometryCollection":
          geometry.geometries.forEach((child) => walkGeometry(child));
          break;
        default:
          break;
      }
    };

    layer.featureCollection.features.forEach((feature) => {
      walkGeometry(feature.geometry as GeoJsonGeometry | null | undefined);
    });

    const bboxAvailable =
      Number.isFinite(minLat) &&
      Number.isFinite(maxLat) &&
      Number.isFinite(minLon) &&
      Number.isFinite(maxLon);

    const polygon = layer.featureCollection.features.some((feature) =>
      geometryMatches(
        feature.geometry as GeoJsonGeometry | null | undefined,
        (type) => type === "Polygon" || type === "MultiPolygon",
      ),
    );
    const line = layer.featureCollection.features.some((feature) =>
      geometryMatches(
        feature.geometry as GeoJsonGeometry | null | undefined,
        (type) => type === "LineString" || type === "MultiLineString",
      ),
    );
    const point = layer.featureCollection.features.some((feature) =>
      geometryMatches(
        feature.geometry as GeoJsonGeometry | null | undefined,
        (type) => type === "Point" || type === "MultiPoint",
      ),
    );

    return {
      feature: layer.feature,
      layerId: layer.layerId,
      category: layer.category,
      name: layer.name,
      featureCount: layer.featureCollection.features.length,
      geometryTypes: { polygon, line, point },
      bbox: bboxAvailable ? [minLat, minLon, maxLat, maxLon] : null,
    };
  });
