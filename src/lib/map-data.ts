import type { GeoJsonGeometry } from "@/types/geojson";
import type { LatLngTuple } from "@/types/tunnels";

export const normalizeToken = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();
  if (!normalized) return null;
  return normalized;
};

export const computeFeatureCentroid = (
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

export const distanceSquared = (a: LatLngTuple, b: LatLngTuple): number => {
  const dLat = a[0] - b[0];
  const dLon = a[1] - b[1];
  return dLat * dLat + dLon * dLon;
};
