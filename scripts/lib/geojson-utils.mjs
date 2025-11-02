export const CAMPUS_BOUNDS = Object.freeze({
  minLat: 44.94,
  maxLat: 45.01,
  minLon: -93.26,
  maxLon: -93.18,
});

const coordinateWithinBounds = (lon, lat, bounds) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= bounds.minLat &&
  lat <= bounds.maxLat &&
  lon >= bounds.minLon &&
  lon <= bounds.maxLon;

const visitGeometryCoordinates = (geometry, visitor) => {
  if (!geometry) return;

  switch (geometry.type) {
    case "Point": {
      const [lon, lat] = geometry.coordinates;
      visitor(lon, lat);
      break;
    }
    case "MultiPoint":
    case "LineString": {
      geometry.coordinates.forEach(([lon, lat]) => visitor(lon, lat));
      break;
    }
    case "MultiLineString":
    case "Polygon": {
      geometry.coordinates.forEach((component) =>
        visitGeometryCoordinates(
          { type: "LineString", coordinates: component },
          visitor,
        ),
      );
      break;
    }
    case "MultiPolygon": {
      geometry.coordinates.forEach((polygon) =>
        visitGeometryCoordinates(
          { type: "Polygon", coordinates: polygon },
          visitor,
        ),
      );
      break;
    }
    case "GeometryCollection": {
      (geometry.geometries ?? []).forEach((child) =>
        visitGeometryCoordinates(child, visitor),
      );
      break;
    }
    default:
      break;
  }
};

const geometryIntersectsBounds = (geometry, bounds) => {
  let intersects = false;

  visitGeometryCoordinates(geometry, (lon, lat) => {
    if (!intersects && coordinateWithinBounds(lon, lat, bounds)) {
      intersects = true;
    }
  });

  return intersects;
};

export const filterFeatureCollectionByBounds = (
  featureCollection,
  bounds = CAMPUS_BOUNDS,
) => {
  if (
    !featureCollection ||
    featureCollection.type !== "FeatureCollection" ||
    !Array.isArray(featureCollection.features)
  ) {
    return featureCollection;
  }

  const filteredFeatures = featureCollection.features.filter((feature) =>
    geometryIntersectsBounds(feature?.geometry, bounds),
  );

  if (filteredFeatures.length === featureCollection.features.length) {
    return featureCollection;
  }

  return {
    ...featureCollection,
    features: filteredFeatures,
  };
};
