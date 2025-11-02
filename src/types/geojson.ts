export type GeoJsonPosition =
  | [number, number]
  | [number, number, number];

export type GeoJsonGeometryType =
  | "Point"
  | "MultiPoint"
  | "LineString"
  | "MultiLineString"
  | "Polygon"
  | "MultiPolygon"
  | "GeometryCollection";

export type GeoJsonGeometry =
  | GeoJsonPoint
  | GeoJsonMultiPoint
  | GeoJsonLineString
  | GeoJsonMultiLineString
  | GeoJsonPolygon
  | GeoJsonMultiPolygon
  | GeoJsonGeometryCollection;

export interface GeoJsonPoint {
  type: "Point";
  coordinates: GeoJsonPosition;
}

export interface GeoJsonMultiPoint {
  type: "MultiPoint";
  coordinates: GeoJsonPosition[];
}

export interface GeoJsonLineString {
  type: "LineString";
  coordinates: GeoJsonPosition[];
}

export interface GeoJsonMultiLineString {
  type: "MultiLineString";
  coordinates: GeoJsonPosition[][];
}

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: GeoJsonPosition[][];
}

export interface GeoJsonMultiPolygon {
  type: "MultiPolygon";
  coordinates: GeoJsonPosition[][][];
}

export interface GeoJsonGeometryCollection {
  type: "GeometryCollection";
  geometries: GeoJsonGeometry[];
}

export interface GeoJsonFeature<
  G extends GeoJsonGeometry | null = GeoJsonGeometry | null,
  P = Record<string, unknown> | null,
> {
  type: "Feature";
  geometry: G;
  properties: P;
}

export interface GeoJsonFeatureCollection<
  G extends GeoJsonGeometry | null = GeoJsonGeometry | null,
  P = Record<string, unknown> | null,
> {
  type: "FeatureCollection";
  features: Array<GeoJsonFeature<G, P>>;
}
