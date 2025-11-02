(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/constants/map.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAP_CENTER",
    ()=>MAP_CENTER,
    "MAP_ZOOM",
    ()=>MAP_ZOOM,
    "TILE_ATTRIBUTION",
    ()=>TILE_ATTRIBUTION,
    "TILE_LAYER_URL",
    ()=>TILE_LAYER_URL
]);
const MAP_CENTER = [
    44.9739,
    -93.2317
];
const MAP_ZOOM = 16.5;
const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/constants/tunnels.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NODE_COLORS",
    ()=>NODE_COLORS,
    "NODE_TYPE_LABEL",
    ()=>NODE_TYPE_LABEL,
    "TUNNEL_HIGHLIGHT",
    ()=>TUNNEL_HIGHLIGHT,
    "TUNNEL_STROKE",
    ()=>TUNNEL_STROKE
]);
const NODE_TYPE_LABEL = {
    academic: "Academic Building",
    student: "Student Life",
    research: "Research & Labs"
};
const NODE_COLORS = {
    academic: "#7a0019",
    student: "#ffcc33",
    research: "#c26d13"
};
const TUNNEL_STROKE = "rgba(122, 0, 25, 0.7)";
const TUNNEL_HIGHLIGHT = "#ffcc33";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/map-view.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapView",
    ()=>MapView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/map.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/tunnels.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const createEmptyBounds = ()=>({
        minLat: Number.POSITIVE_INFINITY,
        maxLat: Number.NEGATIVE_INFINITY,
        minLon: Number.POSITIVE_INFINITY,
        maxLon: Number.NEGATIVE_INFINITY
    });
const extendBounds = (bounds, lat, lon)=>{
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (lat < bounds.minLat) bounds.minLat = lat;
    if (lat > bounds.maxLat) bounds.maxLat = lat;
    if (lon < bounds.minLon) bounds.minLon = lon;
    if (lon > bounds.maxLon) bounds.maxLon = lon;
};
const isBoundsValid = (bounds)=>Number.isFinite(bounds.minLat) && Number.isFinite(bounds.maxLat) && Number.isFinite(bounds.minLon) && Number.isFinite(bounds.maxLon) && bounds.minLat <= bounds.maxLat && bounds.minLon <= bounds.maxLon;
const geometryMatches = (geometry, type)=>{
    if (!geometry) return false;
    switch(geometry.type){
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
            return geometry.geometries.some((child)=>geometryMatches(child, type));
        default:
            return false;
    }
};
const visitGeometry = (geometry, visit)=>{
    if (!geometry) return;
    switch(geometry.type){
        case "Point":
            {
                const [lon, lat] = geometry.coordinates;
                visit(lat, lon);
                break;
            }
        case "MultiPoint":
            geometry.coordinates.forEach(([lon, lat])=>visit(lat, lon));
            break;
        case "LineString":
            geometry.coordinates.forEach(([lon, lat])=>visit(lat, lon));
            break;
        case "MultiLineString":
            geometry.coordinates.forEach((line)=>line.forEach(([lon, lat])=>visit(lat, lon)));
            break;
        case "Polygon":
            geometry.coordinates.forEach((ring)=>ring.forEach(([lon, lat])=>visit(lat, lon)));
            break;
        case "MultiPolygon":
            geometry.coordinates.forEach((polygon)=>polygon.forEach((ring)=>ring.forEach(([lon, lat])=>visit(lat, lon))));
            break;
        case "GeometryCollection":
            geometry.geometries.forEach((child)=>visitGeometry(child, visit));
            break;
        default:
            break;
    }
};
const toLonLat = ([lat, lon])=>[
        lon,
        lat
    ];
const DEFAULT_POLYGON_STYLE = {
    color: "#2563eb",
    weight: 1.5,
    opacity: 0.9,
    fillColor: "#60a5fa",
    fillOpacity: 0.2
};
const LAYER_STYLE_OVERRIDES = {
    GOPHER_WAY_LEVEL_BLDGS: {
        polygon: {
            color: "#0ea5e9",
            fillColor: "#38bdf8",
            fillOpacity: 0.15
        }
    },
    GW_CIRCULATION_AREAS: {
        polygon: {
            color: "#f59e0b",
            fillColor: "#facc15",
            fillOpacity: 0.25
        }
    },
    GW_NON_ADA_ACCESSIBLE: {
        polygon: {
            color: "#f97316",
            dashArray: "6 4",
            fillOpacity: 0.1
        }
    },
    GW_FP_LINES_STAIRS: {
        polygon: {
            color: "#34d399",
            dashArray: "4 4",
            fillOpacity: 0.08
        }
    },
    GW_FP_GROSS_AREA: {
        polygon: {
            color: "#f472b6",
            fillColor: "#fbcfe8",
            fillOpacity: 0.12
        }
    },
    GW_PORTION_DIFFERENT_LEVEL: {
        polygon: {
            color: "#f87171",
            fillColor: "#fecaca",
            fillOpacity: 0.18
        }
    },
    GW_FLOOR_NAME_CHANGE: {
        polygon: {
            color: "#22c55e",
            dashArray: "2 6",
            fillOpacity: 0.08
        }
    }
};
const getLayerStyle = (feature)=>{
    const override = LAYER_STYLE_OVERRIDES[feature]?.polygon ?? {};
    return {
        ...DEFAULT_POLYGON_STYLE,
        ...override
    };
};
const START_MARKER_COLOR = "#22c55e";
const END_MARKER_COLOR = "#ef4444";
const MapView = ({ routeLine, geoJsonLayers, startMarker, endMarker })=>{
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const layerRegistryRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        layers: [],
        sources: []
    });
    const ensureSourcesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        "MapView.useRef[ensureSourcesRef]": ()=>undefined
    }["MapView.useRef[ensureSourcesRef]"]);
    const hasFitBoundsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [mapError, setMapError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const routeFeatureCollection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MapView.useMemo[routeFeatureCollection]": ()=>{
            if (routeLine.length < 2) {
                return null;
            }
            return {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "LineString",
                            coordinates: routeLine.map(toLonLat)
                        }
                    }
                ]
            };
        }
    }["MapView.useMemo[routeFeatureCollection]"], [
        routeLine
    ]);
    const markerFeatureCollection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MapView.useMemo[markerFeatureCollection]": ()=>{
            const features = [];
            if (startMarker) {
                features.push({
                    type: "Feature",
                    properties: {
                        markerType: "start"
                    },
                    geometry: {
                        type: "Point",
                        coordinates: toLonLat(startMarker)
                    }
                });
            }
            if (endMarker) {
                features.push({
                    type: "Feature",
                    properties: {
                        markerType: "end"
                    },
                    geometry: {
                        type: "Point",
                        coordinates: toLonLat(endMarker)
                    }
                });
            }
            if (features.length === 0) {
                return null;
            }
            return {
                type: "FeatureCollection",
                features
            };
        }
    }["MapView.useMemo[markerFeatureCollection]"], [
        startMarker,
        endMarker
    ]);
    const osmTileUrls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MapView.useMemo[osmTileUrls]": ()=>{
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TILE_LAYER_URL"].includes("{s}")) {
                return [
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TILE_LAYER_URL"]
                ];
            }
            return [
                "a",
                "b",
                "c"
            ].map({
                "MapView.useMemo[osmTileUrls]": (subdomain)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TILE_LAYER_URL"].replace("{s}", subdomain)
            }["MapView.useMemo[osmTileUrls]"]);
        }
    }["MapView.useMemo[osmTileUrls]"], []);
    const ensureSources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MapView.useCallback[ensureSources]": (shouldFitBounds)=>{
            const map = mapRef.current;
            if (!map) {
                return;
            }
            const { layers, sources } = layerRegistryRef.current;
            [
                ...layers
            ].reverse().forEach({
                "MapView.useCallback[ensureSources]": (layerId)=>{
                    if (map.getLayer(layerId)) {
                        map.removeLayer(layerId);
                    }
                }
            }["MapView.useCallback[ensureSources]"]);
            [
                ...sources
            ].reverse().forEach({
                "MapView.useCallback[ensureSources]": (sourceId)=>{
                    if (map.getSource(sourceId)) {
                        map.removeSource(sourceId);
                    }
                }
            }["MapView.useCallback[ensureSources]"]);
            const nextLayers = [];
            const nextSources = [];
            const bounds = createEmptyBounds();
            const recordLayer = {
                "MapView.useCallback[ensureSources].recordLayer": (layerId)=>{
                    nextLayers.push(layerId);
                }
            }["MapView.useCallback[ensureSources].recordLayer"];
            const recordSource = {
                "MapView.useCallback[ensureSources].recordSource": (sourceId)=>{
                    nextSources.push(sourceId);
                }
            }["MapView.useCallback[ensureSources].recordSource"];
            geoJsonLayers.forEach({
                "MapView.useCallback[ensureSources]": (layer)=>{
                    const sourceId = `arcgis-${layer.feature}-${layer.layerId}`;
                    map.addSource(sourceId, {
                        type: "geojson",
                        data: layer.featureCollection
                    });
                    recordSource(sourceId);
                    const style = getLayerStyle(layer.feature);
                    const hasPolygons = layer.featureCollection.features.some({
                        "MapView.useCallback[ensureSources].hasPolygons": (feature)=>geometryMatches(feature.geometry, "polygon")
                    }["MapView.useCallback[ensureSources].hasPolygons"]);
                    const hasLines = layer.featureCollection.features.some({
                        "MapView.useCallback[ensureSources].hasLines": (feature)=>geometryMatches(feature.geometry, "line")
                    }["MapView.useCallback[ensureSources].hasLines"]);
                    layer.featureCollection.features.forEach({
                        "MapView.useCallback[ensureSources]": (feature)=>{
                            visitGeometry(feature.geometry, {
                                "MapView.useCallback[ensureSources]": (lat, lon)=>extendBounds(bounds, lat, lon)
                            }["MapView.useCallback[ensureSources]"]);
                        }
                    }["MapView.useCallback[ensureSources]"]);
                    if (hasPolygons) {
                        const fillId = `${sourceId}-fill`;
                        map.addLayer({
                            id: fillId,
                            type: "fill",
                            source: sourceId,
                            filter: [
                                "==",
                                "$type",
                                "Polygon"
                            ],
                            paint: {
                                "fill-color": style.fillColor,
                                "fill-opacity": style.fillOpacity
                            }
                        });
                        recordLayer(fillId);
                        const outlineId = `${sourceId}-outline`;
                        const outlinePaint = {
                            "line-color": style.color,
                            "line-width": style.weight,
                            "line-opacity": style.opacity
                        };
                        if (style.dashArray) {
                            outlinePaint["line-dasharray"] = style.dashArray.split(/\s+/).map({
                                "MapView.useCallback[ensureSources]": (chunk)=>Number.parseFloat(chunk)
                            }["MapView.useCallback[ensureSources]"]).filter({
                                "MapView.useCallback[ensureSources]": (value)=>Number.isFinite(value) && value > 0
                            }["MapView.useCallback[ensureSources]"]);
                        }
                        map.addLayer({
                            id: outlineId,
                            type: "line",
                            source: sourceId,
                            filter: [
                                "==",
                                "$type",
                                "Polygon"
                            ],
                            paint: outlinePaint
                        });
                        recordLayer(outlineId);
                    }
                    if (hasLines) {
                        const lineId = `${sourceId}-line`;
                        const linePaint = {
                            "line-color": style.color,
                            "line-width": Math.max(style.weight - 0.5, 1),
                            "line-opacity": style.opacity
                        };
                        if (style.dashArray) {
                            linePaint["line-dasharray"] = style.dashArray.split(/\s+/).map({
                                "MapView.useCallback[ensureSources]": (chunk)=>Number.parseFloat(chunk)
                            }["MapView.useCallback[ensureSources]"]).filter({
                                "MapView.useCallback[ensureSources]": (value)=>Number.isFinite(value) && value > 0
                            }["MapView.useCallback[ensureSources]"]);
                        }
                        map.addLayer({
                            id: lineId,
                            type: "line",
                            source: sourceId,
                            filter: [
                                "any",
                                [
                                    "==",
                                    "$type",
                                    "LineString"
                                ],
                                [
                                    "==",
                                    "$type",
                                    "MultiLineString"
                                ]
                            ],
                            paint: linePaint
                        });
                        recordLayer(lineId);
                    }
                }
            }["MapView.useCallback[ensureSources]"]);
            if (routeFeatureCollection && routeFeatureCollection.features.length > 0) {
                map.addSource("route-highlight", {
                    type: "geojson",
                    data: routeFeatureCollection
                });
                recordSource("route-highlight");
                routeFeatureCollection.features[0].geometry.coordinates.forEach({
                    "MapView.useCallback[ensureSources]": ([lon, lat])=>extendBounds(bounds, lat, lon)
                }["MapView.useCallback[ensureSources]"]);
                map.addLayer({
                    id: "route-highlight-line",
                    type: "line",
                    source: "route-highlight",
                    paint: {
                        "line-color": __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TUNNEL_HIGHLIGHT"],
                        "line-width": 5,
                        "line-opacity": 0.9
                    },
                    layout: {
                        "line-cap": "round",
                        "line-join": "round"
                    }
                });
                recordLayer("route-highlight-line");
            }
            if (markerFeatureCollection && markerFeatureCollection.features.length > 0) {
                map.addSource("route-markers", {
                    type: "geojson",
                    data: markerFeatureCollection
                });
                recordSource("route-markers");
                markerFeatureCollection.features.forEach({
                    "MapView.useCallback[ensureSources]": (feature)=>{
                        const [lon, lat] = feature.geometry.coordinates;
                        extendBounds(bounds, lat, lon);
                    }
                }["MapView.useCallback[ensureSources]"]);
                map.addLayer({
                    id: "route-markers-circle",
                    type: "circle",
                    source: "route-markers",
                    paint: {
                        "circle-radius": 8,
                        "circle-color": [
                            "case",
                            [
                                "==",
                                [
                                    "get",
                                    "markerType"
                                ],
                                "start"
                            ],
                            START_MARKER_COLOR,
                            [
                                "==",
                                [
                                    "get",
                                    "markerType"
                                ],
                                "end"
                            ],
                            END_MARKER_COLOR,
                            START_MARKER_COLOR
                        ],
                        "circle-opacity": 0.95,
                        "circle-stroke-color": "#ffffff",
                        "circle-stroke-width": 2
                    }
                });
                recordLayer("route-markers-circle");
            }
            layerRegistryRef.current = {
                layers: nextLayers,
                sources: nextSources
            };
            if (shouldFitBounds && isBoundsValid(bounds) && !hasFitBoundsRef.current) {
                map.fitBounds([
                    [
                        bounds.minLon,
                        bounds.minLat
                    ],
                    [
                        bounds.maxLon,
                        bounds.maxLat
                    ]
                ], {
                    padding: 60,
                    maxZoom: 18,
                    duration: 0
                });
                hasFitBoundsRef.current = true;
            }
        }
    }["MapView.useCallback[ensureSources]"], [
        geoJsonLayers,
        routeFeatureCollection,
        markerFeatureCollection
    ]);
    ensureSourcesRef.current = ensureSources;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapView.useEffect": ()=>{
            if (!containerRef.current || mapRef.current) {
                return;
            }
            let isDestroyed = false;
            setMapError(null);
            const initialize = {
                "MapView.useEffect.initialize": async ()=>{
                    try {
                        const maplibregl = await __turbopack_context__.A("[project]/node_modules/maplibre-gl/dist/maplibre-gl.js [app-client] (ecmascript, async loader)");
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
                                        attribution: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TILE_ATTRIBUTION"]
                                    }
                                },
                                layers: [
                                    {
                                        id: "osm-base",
                                        type: "raster",
                                        source: "osm-base",
                                        minzoom: 0,
                                        maxzoom: 19
                                    }
                                ]
                            },
                            center: [
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAP_CENTER"][1],
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAP_CENTER"][0]
                            ],
                            zoom: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$map$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAP_ZOOM"],
                            minZoom: 12,
                            maxZoom: 20,
                            pitch: 0,
                            bearing: 0,
                            maxPitch: 0,
                            dragRotate: false,
                            pitchWithRotate: false,
                            pitchWithTwoFingerDrag: false
                        });
                        const mapAny = map;
                        mapRef.current = map;
                        if (maplibregl.NavigationControl) {
                            map.addControl(new maplibregl.NavigationControl({
                                showCompass: false
                            }), "top-right");
                        }
                        const handleLoad = {
                            "MapView.useEffect.initialize.handleLoad": ()=>{
                                if (!isDestroyed) {
                                    if (typeof mapAny.dragRotate?.disable === "function") {
                                        mapAny.dragRotate.disable();
                                    }
                                    if (typeof mapAny.touchZoomRotate?.disableRotation === "function") {
                                        mapAny.touchZoomRotate.disableRotation();
                                    }
                                    ensureSourcesRef.current(true);
                                }
                            }
                        }["MapView.useEffect.initialize.handleLoad"];
                        map.once("load", handleLoad);
                    } catch (error) {
                        console.error("Failed to load MapLibre GL", error);
                        if (!isDestroyed) {
                            setMapError("Unable to load map view right now.");
                        }
                    }
                }
            }["MapView.useEffect.initialize"];
            void initialize();
            return ({
                "MapView.useEffect": ()=>{
                    isDestroyed = true;
                    const map = mapRef.current;
                    if (map) {
                        map.remove();
                        mapRef.current = null;
                    }
                    layerRegistryRef.current = {
                        layers: [],
                        sources: []
                    };
                    hasFitBoundsRef.current = false;
                }
            })["MapView.useEffect"];
        }
    }["MapView.useEffect"], [
        osmTileUrls
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapView.useEffect": ()=>{
            const map = mapRef.current;
            if (!map) {
                return;
            }
            if (typeof map.isStyleLoaded === "function" && !map.isStyleLoaded()) {
                const handleLoad = {
                    "MapView.useEffect.handleLoad": ()=>{
                        ensureSources(false);
                    }
                }["MapView.useEffect.handleLoad"];
                map.once("load", handleLoad);
                return ({
                    "MapView.useEffect": ()=>{
                        if (typeof map.off === "function") {
                            map.off("load", handleLoad);
                        }
                    }
                })["MapView.useEffect"];
            }
            ensureSources(false);
        }
    }["MapView.useEffect"], [
        ensureSources
    ]);
    if (mapError) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "map-shell map-error",
            children: mapError
        }, void 0, false, {
            fileName: "[project]/src/components/map-view.tsx",
            lineNumber: 607,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "map-shell",
        role: "application",
        "aria-label": "Campus map"
    }, void 0, false, {
        fileName: "[project]/src/components/map-view.tsx",
        lineNumber: 611,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(MapView, "lK/Z/FxDQuMsUYKUn4rFWFQvanc=");
_c = MapView;
var _c;
__turbopack_context__.k.register(_c, "MapView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HomePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$map$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/map-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/tunnels.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$trpc$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/trpc/client.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const normalizeToken = (value)=>{
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();
    if (!normalized) return null;
    return normalized;
};
const computeFeatureCentroid = (geometry)=>{
    if (!geometry) return null;
    let sumLat = 0;
    let sumLon = 0;
    let count = 0;
    const record = (lon, lat)=>{
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        sumLat += lat;
        sumLon += lon;
        count += 1;
    };
    const walk = (geom)=>{
        if (!geom) return;
        switch(geom.type){
            case "Point":
                record(geom.coordinates[0], geom.coordinates[1]);
                break;
            case "MultiPoint":
            case "LineString":
                geom.coordinates.forEach(([lon, lat])=>record(lon, lat));
                break;
            case "MultiLineString":
            case "Polygon":
                geom.coordinates.forEach((segment)=>{
                    segment.forEach(([lon, lat])=>record(lon, lat));
                });
                break;
            case "MultiPolygon":
                geom.coordinates.forEach((polygon)=>{
                    polygon.forEach((ring)=>{
                        ring.forEach(([lon, lat])=>record(lon, lat));
                    });
                });
                break;
            case "GeometryCollection":
                geom.geometries.forEach((child)=>walk(child));
                break;
            default:
                break;
        }
    };
    walk(geometry);
    if (count === 0) return null;
    return [
        sumLat / count,
        sumLon / count
    ];
};
const distanceSquared = (a, b)=>{
    const dLat = a[0] - b[0];
    const dLon = a[1] - b[1];
    return dLat * dLat + dLon * dLon;
};
function HomePage() {
    _s();
    const { data: arcgisData } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$trpc$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].arcgis.mapData.useQuery();
    const geoJsonLayers = arcgisData?.layers ?? [];
    const [startBuildingId, setStartBuildingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [endBuildingId, setEndBuildingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [startQuery, setStartQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [endQuery, setEndQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [routeNodeIds, setRouteNodeIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [routeAttempted, setRouteAttempted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const routeLayer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeLayer]": ()=>geoJsonLayers.find({
                "HomePage.useMemo[routeLayer]": (layer)=>layer.feature === "GW_ROUTE"
            }["HomePage.useMemo[routeLayer]"]) ?? null
    }["HomePage.useMemo[routeLayer]"], [
        geoJsonLayers
    ]);
    const routeGraph = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeGraph]": ()=>{
            const nodes = new Map();
            if (!routeLayer) {
                return {
                    nodes
                };
            }
            const keyFor = {
                "HomePage.useMemo[routeGraph].keyFor": (lat, lon)=>`${lat.toFixed(6)},${lon.toFixed(6)}`
            }["HomePage.useMemo[routeGraph].keyFor"];
            const ensureNode = {
                "HomePage.useMemo[routeGraph].ensureNode": (lat, lon)=>{
                    const key = keyFor(lat, lon);
                    if (!nodes.has(key)) {
                        nodes.set(key, {
                            position: [
                                lat,
                                lon
                            ],
                            neighbors: new Map()
                        });
                    }
                    return key;
                }
            }["HomePage.useMemo[routeGraph].ensureNode"];
            const haversineDistance = {
                "HomePage.useMemo[routeGraph].haversineDistance": (a, b)=>{
                    const R = 6371000;
                    const toRad = {
                        "HomePage.useMemo[routeGraph].haversineDistance.toRad": (deg)=>deg * Math.PI / 180
                    }["HomePage.useMemo[routeGraph].haversineDistance.toRad"];
                    const dLat = toRad(b[0] - a[0]);
                    const dLon = toRad(b[1] - a[1]);
                    const lat1 = toRad(a[0]);
                    const lat2 = toRad(b[0]);
                    const sinLat = Math.sin(dLat / 2);
                    const sinLon = Math.sin(dLon / 2);
                    const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
                    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
                    return R * c;
                }
            }["HomePage.useMemo[routeGraph].haversineDistance"];
            const addEdge = {
                "HomePage.useMemo[routeGraph].addEdge": (fromKey, toKey)=>{
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
                }
            }["HomePage.useMemo[routeGraph].addEdge"];
            const processLine = {
                "HomePage.useMemo[routeGraph].processLine": (coordinates)=>{
                    for(let index = 0; index < coordinates.length - 1; index += 1){
                        const [lonA, latA] = coordinates[index];
                        const [lonB, latB] = coordinates[index + 1];
                        const keyA = ensureNode(latA, lonA);
                        const keyB = ensureNode(latB, lonB);
                        addEdge(keyA, keyB);
                    }
                }
            }["HomePage.useMemo[routeGraph].processLine"];
            const walkGeometry = {
                "HomePage.useMemo[routeGraph].walkGeometry": (geometry)=>{
                    if (!geometry) return;
                    switch(geometry.type){
                        case "LineString":
                            processLine(geometry.coordinates);
                            break;
                        case "MultiLineString":
                            geometry.coordinates.forEach({
                                "HomePage.useMemo[routeGraph].walkGeometry": (segment)=>processLine(segment)
                            }["HomePage.useMemo[routeGraph].walkGeometry"]);
                            break;
                        case "GeometryCollection":
                            geometry.geometries.forEach({
                                "HomePage.useMemo[routeGraph].walkGeometry": (child)=>walkGeometry(child)
                            }["HomePage.useMemo[routeGraph].walkGeometry"]);
                            break;
                        default:
                            break;
                    }
                }
            }["HomePage.useMemo[routeGraph].walkGeometry"];
            routeLayer.featureCollection.features.forEach({
                "HomePage.useMemo[routeGraph]": (feature)=>{
                    walkGeometry(feature.geometry);
                }
            }["HomePage.useMemo[routeGraph]"]);
            return {
                nodes
            };
        }
    }["HomePage.useMemo[routeGraph]"], [
        routeLayer
    ]);
    const routeNodeEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeNodeEntries]": ()=>Array.from(routeGraph.nodes.entries())
    }["HomePage.useMemo[routeNodeEntries]"], [
        routeGraph
    ]);
    const buildingOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[buildingOptions]": ()=>{
            const buildingLayer = geoJsonLayers.find({
                "HomePage.useMemo[buildingOptions].buildingLayer": (layer)=>layer.feature === "EGISADMIN_BUILDING_POLYGON_HOSTED"
            }["HomePage.useMemo[buildingOptions].buildingLayer"]);
            if (!buildingLayer) {
                return [];
            }
            const seen = new Map();
            buildingLayer.featureCollection.features.forEach({
                "HomePage.useMemo[buildingOptions]": (feature, index)=>{
                    const properties = feature.properties ?? {};
                    const rawName = properties.BLDG_NAME_LABEL ?? properties.TRI_BLDG_LONG_NAME ?? properties.TRI_LEGAL_NAME ?? properties.TRI_BLDG_NAME ?? properties.NAME ?? "";
                    const name = rawName.trim();
                    if (!name) {
                        return;
                    }
                    const centroid = computeFeatureCentroid(feature.geometry);
                    if (!centroid) {
                        return;
                    }
                    const rawId = properties.SITE_BUILDING ?? properties.GlobalID ?? properties.OBJECTID ?? `building-${index}`;
                    const id = String(rawId);
                    if (seen.has(id)) {
                        return;
                    }
                    const tokenSet = new Set();
                    const addToken = {
                        "HomePage.useMemo[buildingOptions].addToken": (value)=>{
                            const normalized = normalizeToken(value);
                            if (!normalized) return;
                            tokenSet.add(normalized);
                            const cleaned = normalized.replace(/\([^)]*\)/g, "").trim();
                            if (cleaned && cleaned !== normalized) {
                                tokenSet.add(cleaned);
                            }
                            cleaned.split(/\s+/).filter({
                                "HomePage.useMemo[buildingOptions].addToken": (part)=>part.length > 2
                            }["HomePage.useMemo[buildingOptions].addToken"]).forEach({
                                "HomePage.useMemo[buildingOptions].addToken": (part)=>tokenSet.add(part)
                            }["HomePage.useMemo[buildingOptions].addToken"]);
                        }
                    }["HomePage.useMemo[buildingOptions].addToken"];
                    addToken(name);
                    addToken(properties.BLDG_NAME_LABEL_SHORT);
                    addToken(properties.TRI_BLDG_NAME);
                    addToken(properties.TRI_BLDG_ABBR);
                    addToken(properties.SITE_BUILDING);
                    seen.set(id, {
                        id,
                        name,
                        position: centroid,
                        tokens: Array.from(tokenSet)
                    });
                }
            }["HomePage.useMemo[buildingOptions]"]);
            return Array.from(seen.values()).sort({
                "HomePage.useMemo[buildingOptions]": (a, b)=>a.name.localeCompare(b.name)
            }["HomePage.useMemo[buildingOptions]"]);
        }
    }["HomePage.useMemo[buildingOptions]"], [
        geoJsonLayers
    ]);
    const buildingMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[buildingMap]": ()=>new Map(buildingOptions.map({
                "HomePage.useMemo[buildingMap]": (option)=>[
                        option.id,
                        option
                    ]
            }["HomePage.useMemo[buildingMap]"]))
    }["HomePage.useMemo[buildingMap]"], [
        buildingOptions
    ]);
    const buildingToNearestNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[buildingToNearestNode]": ()=>{
            const map = new Map();
            if (routeNodeEntries.length === 0) {
                return map;
            }
            buildingOptions.forEach({
                "HomePage.useMemo[buildingToNearestNode]": (building)=>{
                    let bestId = null;
                    let bestDistance = Number.POSITIVE_INFINITY;
                    routeNodeEntries.forEach({
                        "HomePage.useMemo[buildingToNearestNode]": ([nodeId, node])=>{
                            const distance = distanceSquared(building.position, node.position);
                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestId = nodeId;
                            }
                        }
                    }["HomePage.useMemo[buildingToNearestNode]"]);
                    if (bestId) {
                        map.set(building.id, bestId);
                    }
                }
            }["HomePage.useMemo[buildingToNearestNode]"]);
            return map;
        }
    }["HomePage.useMemo[buildingToNearestNode]"], [
        buildingOptions,
        routeNodeEntries
    ]);
    const matchExactBuilding = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[matchExactBuilding]": (value)=>{
            const normalized = normalizeToken(value);
            if (!normalized) return null;
            return buildingOptions.find({
                "HomePage.useCallback[matchExactBuilding]": (option)=>option.tokens.some({
                        "HomePage.useCallback[matchExactBuilding]": (token)=>token === normalized
                    }["HomePage.useCallback[matchExactBuilding]"])
            }["HomePage.useCallback[matchExactBuilding]"]) ?? null;
        }
    }["HomePage.useCallback[matchExactBuilding]"], [
        buildingOptions
    ]);
    const filterOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[filterOptions]": (query)=>{
            if (buildingOptions.length === 0) {
                return [];
            }
            const normalized = normalizeToken(query);
            if (!normalized) {
                return buildingOptions.slice(0, 12);
            }
            return buildingOptions.filter({
                "HomePage.useCallback[filterOptions]": (option)=>option.tokens.some({
                        "HomePage.useCallback[filterOptions]": (token)=>token.includes(normalized)
                    }["HomePage.useCallback[filterOptions]"])
            }["HomePage.useCallback[filterOptions]"]).slice(0, 12);
        }
    }["HomePage.useCallback[filterOptions]"], [
        buildingOptions
    ]);
    const startBuilding = startBuildingId ? buildingMap.get(startBuildingId) ?? null : null;
    const endBuilding = endBuildingId ? buildingMap.get(endBuildingId) ?? null : null;
    const startNodeId = startBuildingId ? buildingToNearestNode.get(startBuildingId) ?? null : null;
    const endNodeId = endBuildingId ? buildingToNearestNode.get(endBuildingId) ?? null : null;
    const computeNodeRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[computeNodeRoute]": (startNode, endNode)=>{
            if (!startNode || !endNode) {
                return [];
            }
            if (startNode === endNode) {
                return [
                    startNode
                ];
            }
            const nodesMap = routeGraph.nodes;
            if (!nodesMap.has(startNode) || !nodesMap.has(endNode)) {
                return [];
            }
            const distances = new Map();
            const previous = new Map();
            const queue = [];
            const enqueue = {
                "HomePage.useCallback[computeNodeRoute].enqueue": (id, distance)=>{
                    queue.push({
                        id,
                        distance
                    });
                    queue.sort({
                        "HomePage.useCallback[computeNodeRoute].enqueue": (a, b)=>a.distance - b.distance
                    }["HomePage.useCallback[computeNodeRoute].enqueue"]);
                }
            }["HomePage.useCallback[computeNodeRoute].enqueue"];
            distances.set(startNode, 0);
            previous.set(startNode, null);
            enqueue(startNode, 0);
            while(queue.length > 0){
                const current = queue.shift();
                if (current.id === endNode) {
                    break;
                }
                const node = nodesMap.get(current.id);
                if (!node) continue;
                node.neighbors.forEach({
                    "HomePage.useCallback[computeNodeRoute]": (weight, neighbor)=>{
                        const candidate = current.distance + weight;
                        if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
                            distances.set(neighbor, candidate);
                            previous.set(neighbor, current.id);
                            enqueue(neighbor, candidate);
                        }
                    }
                }["HomePage.useCallback[computeNodeRoute]"]);
            }
            if (!previous.has(endNode)) {
                return [];
            }
            const path = [];
            let current = endNode;
            while(current){
                path.push(current);
                current = previous.get(current) ?? null;
            }
            path.reverse();
            return path;
        }
    }["HomePage.useCallback[computeNodeRoute]"], [
        routeGraph
    ]);
    const routeLine = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeLine]": ()=>routeNodeIds.map({
                "HomePage.useMemo[routeLine]": (id)=>routeGraph.nodes.get(id)?.position
            }["HomePage.useMemo[routeLine]"]).filter({
                "HomePage.useMemo[routeLine]": (value)=>Array.isArray(value) && value.length === 2
            }["HomePage.useMemo[routeLine]"])
    }["HomePage.useMemo[routeLine]"], [
        routeNodeIds,
        routeGraph
    ]);
    const routeSteps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeSteps]": ()=>{
            const steps = [];
            if (startBuilding) {
                steps.push({
                    id: startBuilding.id,
                    label: startBuilding.name
                });
            }
            if (endBuilding) {
                steps.push({
                    id: endBuilding.id,
                    label: endBuilding.name
                });
            }
            return steps;
        }
    }["HomePage.useMemo[routeSteps]"], [
        startBuilding,
        endBuilding
    ]);
    const routeAvailable = routeLine.length > 1;
    const routeSummary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeSummary]": ()=>{
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
        }
    }["HomePage.useMemo[routeSummary]"], [
        startBuildingId,
        endBuildingId,
        routeAttempted,
        routeNodeIds,
        startBuilding,
        endBuilding
    ]);
    const startSuggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[startSuggestions]": ()=>filterOptions(startQuery)
    }["HomePage.useMemo[startSuggestions]"], [
        filterOptions,
        startQuery
    ]);
    const endSuggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[endSuggestions]": ()=>filterOptions(endQuery)
    }["HomePage.useMemo[endSuggestions]"], [
        filterOptions,
        endQuery
    ]);
    const normalizedStartQuery = normalizeToken(startQuery);
    const normalizedEndQuery = normalizeToken(endQuery);
    const showStartSuggestions = normalizedStartQuery !== null && (!startBuilding || normalizeToken(startBuilding.name) !== normalizedStartQuery);
    const showEndSuggestions = normalizedEndQuery !== null && (!endBuilding || normalizeToken(endBuilding.name) !== normalizedEndQuery);
    const handleStartInputChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handleStartInputChange]": (value)=>{
            setStartQuery(value);
            const match = matchExactBuilding(value);
            if (match) {
                setStartBuildingId(match.id);
                setRouteNodeIds([]);
                setRouteAttempted(false);
            } else {
                setStartBuildingId("");
            }
        }
    }["HomePage.useCallback[handleStartInputChange]"], [
        matchExactBuilding
    ]);
    const handleEndInputChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handleEndInputChange]": (value)=>{
            setEndQuery(value);
            const match = matchExactBuilding(value);
            if (match) {
                setEndBuildingId(match.id);
                setRouteNodeIds([]);
                setRouteAttempted(false);
            } else {
                setEndBuildingId("");
            }
        }
    }["HomePage.useCallback[handleEndInputChange]"], [
        matchExactBuilding
    ]);
    const handleStartSuggestionSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handleStartSuggestionSelect]": (option)=>{
            setStartBuildingId(option.id);
            setStartQuery(option.name);
            setRouteNodeIds([]);
            setRouteAttempted(false);
        }
    }["HomePage.useCallback[handleStartSuggestionSelect]"], []);
    const handleEndSuggestionSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handleEndSuggestionSelect]": (option)=>{
            setEndBuildingId(option.id);
            setEndQuery(option.name);
            setRouteNodeIds([]);
            setRouteAttempted(false);
        }
    }["HomePage.useCallback[handleEndSuggestionSelect]"], []);
    const handleFindRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handleFindRoute]": ()=>{
            const route = computeNodeRoute(startNodeId, endNodeId);
            setRouteNodeIds(route);
            setRouteAttempted(true);
        }
    }["HomePage.useCallback[handleFindRoute]"], [
        computeNodeRoute,
        startNodeId,
        endNodeId
    ]);
    const handleClear = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handleClear]": ()=>{
            setStartBuildingId("");
            setEndBuildingId("");
            setStartQuery("");
            setEndQuery("");
            setRouteNodeIds([]);
            setRouteAttempted(false);
        }
    }["HomePage.useCallback[handleClear]"], []);
    const popularRoutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[popularRoutes]": ()=>{
            const presets = [
                {
                    label: "Northrop → Coffman Union",
                    startTokens: [
                        "northrop"
                    ],
                    endTokens: [
                        "coffman"
                    ]
                },
                {
                    label: "Walter Library → Keller Hall",
                    startTokens: [
                        "walter"
                    ],
                    endTokens: [
                        "keller"
                    ]
                },
                {
                    label: "STSS → Peik Hall",
                    startTokens: [
                        "stss",
                        "science teaching"
                    ],
                    endTokens: [
                        "peik"
                    ]
                }
            ];
            return presets.map({
                "HomePage.useMemo[popularRoutes]": (preset)=>{
                    const startOption = buildingOptions.find({
                        "HomePage.useMemo[popularRoutes].startOption": (option)=>preset.startTokens.some({
                                "HomePage.useMemo[popularRoutes].startOption": (token)=>option.tokens.some({
                                        "HomePage.useMemo[popularRoutes].startOption": (value)=>value.includes(token)
                                    }["HomePage.useMemo[popularRoutes].startOption"])
                            }["HomePage.useMemo[popularRoutes].startOption"])
                    }["HomePage.useMemo[popularRoutes].startOption"]);
                    const endOption = buildingOptions.find({
                        "HomePage.useMemo[popularRoutes].endOption": (option)=>preset.endTokens.some({
                                "HomePage.useMemo[popularRoutes].endOption": (token)=>option.tokens.some({
                                        "HomePage.useMemo[popularRoutes].endOption": (value)=>value.includes(token)
                                    }["HomePage.useMemo[popularRoutes].endOption"])
                            }["HomePage.useMemo[popularRoutes].endOption"])
                    }["HomePage.useMemo[popularRoutes].endOption"]);
                    if (!startOption || !endOption) {
                        return null;
                    }
                    return {
                        label: preset.label,
                        startId: startOption.id,
                        endId: endOption.id
                    };
                }
            }["HomePage.useMemo[popularRoutes]"]).filter(Boolean);
        }
    }["HomePage.useMemo[popularRoutes]"], [
        buildingOptions
    ]);
    const handlePopularSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HomePage.useCallback[handlePopularSelect]": (startId, endId)=>{
            const startOption = buildingMap.get(startId);
            const endOption = buildingMap.get(endId);
            if (!startOption || !endOption) {
                return;
            }
            setStartBuildingId(startId);
            setEndBuildingId(endId);
            setStartQuery(startOption.name);
            setEndQuery(endOption.name);
            const route = computeNodeRoute(buildingToNearestNode.get(startId) ?? null, buildingToNearestNode.get(endId) ?? null);
            setRouteNodeIds(route);
            setRouteAttempted(true);
        }
    }["HomePage.useCallback[handlePopularSelect]"], [
        buildingMap,
        computeNodeRoute,
        buildingToNearestNode
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            if (!startBuildingId) return;
            const option = buildingMap.get(startBuildingId);
            if (option) {
                setStartQuery(option.name);
            }
        }
    }["HomePage.useEffect"], [
        startBuildingId,
        buildingMap
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            if (!endBuildingId) return;
            const option = buildingMap.get(endBuildingId);
            if (option) {
                setEndQuery(option.name);
            }
        }
    }["HomePage.useEffect"], [
        endBuildingId,
        buildingMap
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "app-shell",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "top-bar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "brand",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "brand-icon",
                                "aria-hidden": "true",
                                children: "CS"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 627,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Campus Sync"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 631,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "brand-subtitle",
                                        children: "UMN Tunnel Explorer"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 632,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 630,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 626,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "search-bar",
                        role: "search",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search buildings, tunnels, or dining",
                                "aria-label": "Search campus map"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 636,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                children: "Search"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 641,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 635,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "header-actions",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "icon-button",
                                "aria-label": "Map layers",
                                children: "⊞"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 644,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "icon-button",
                                "aria-label": "Settings",
                                children: "☰"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 647,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "avatar",
                                "aria-hidden": "true",
                                children: "NK"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 650,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 643,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 625,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "workspace",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "side-panel",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Explore tunnels"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 659,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Toggle layers and highlights to plan your trip through the Gopher Way tunnel network."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 660,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "layer-options",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "layer-toggle active",
                                                type: "button",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "status-dot open",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 666,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Open tunnels"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 665,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "layer-toggle",
                                                type: "button",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "status-dot limited",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 670,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Limited access"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 669,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "layer-toggle",
                                                type: "button",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "status-dot construction",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 674,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Construction updates"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 673,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 664,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 658,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Plan a route"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 681,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "route-form",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "route-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Start"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 684,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        value: startQuery,
                                                        onChange: (event)=>handleStartInputChange(event.target.value),
                                                        placeholder: "Search building",
                                                        autoComplete: "off",
                                                        list: "building-options-list"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 685,
                                                        columnNumber: 17
                                                    }, this),
                                                    showStartSuggestions && startSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "route-suggestions",
                                                        children: startSuggestions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>handleStartSuggestionSelect(option),
                                                                    children: option.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 697,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, option.id, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 696,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 694,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 683,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "route-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Destination"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 709,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        value: endQuery,
                                                        onChange: (event)=>handleEndInputChange(event.target.value),
                                                        placeholder: "Search building",
                                                        autoComplete: "off",
                                                        list: "building-options-list"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 710,
                                                        columnNumber: 17
                                                    }, this),
                                                    showEndSuggestions && endSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "route-suggestions",
                                                        children: endSuggestions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>handleEndSuggestionSelect(option),
                                                                    children: option.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 722,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, option.id, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 721,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 719,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 708,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "route-actions",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "layer-toggle",
                                                        onClick: handleFindRoute,
                                                        disabled: !startBuildingId || !endBuildingId,
                                                        children: "Find route"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 734,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "layer-toggle",
                                                        onClick: handleClear,
                                                        disabled: !startBuildingId && !endBuildingId && startQuery === "" && endQuery === "" && routeNodeIds.length === 0,
                                                        children: "Clear"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 742,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 733,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "route-summary",
                                                children: routeSummary
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 757,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 682,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                                        id: "building-options-list",
                                        children: buildingOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: option.name
                                            }, option.id, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 761,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 759,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 680,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Popular connections"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 767,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "popular-list",
                                        children: popularRoutes.map((route, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "layer-toggle",
                                                    onClick: ()=>handlePopularSelect(route.startId, route.endId),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "node-badge",
                                                            children: String.fromCharCode(65 + index)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 778,
                                                            columnNumber: 21
                                                        }, this),
                                                        route.label
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 771,
                                                    columnNumber: 19
                                                }, this)
                                            }, `${route.startId}-${route.endId}`, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 770,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 768,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 766,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section tunnel-legend",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Segment legend"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 789,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-line open",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 792,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Open underground connector"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 791,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-line detour",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 796,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Winter route detour"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 795,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-dot academic",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 800,
                                                        columnNumber: 17
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_TYPE_LABEL"].academic
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 799,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-dot student",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 804,
                                                        columnNumber: 17
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_TYPE_LABEL"].student
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 803,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-dot research",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 808,
                                                        columnNumber: 17
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_TYPE_LABEL"].research
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 807,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 790,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 788,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 657,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "map-area",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "map-canvas",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$map$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapView"], {
                                    routeLine: routeLine,
                                    geoJsonLayers: geoJsonLayers,
                                    startMarker: startBuilding?.position ?? null,
                                    endMarker: endBuilding?.position ?? null
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 817,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "floating-card directions-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Route preview"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 826,
                                                    columnNumber: 17
                                                }, this),
                                                routeAvailable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "badge badge-live",
                                                    children: [
                                                        routeNodeIds.length - 1,
                                                        " segment",
                                                        routeNodeIds.length - 1 === 1 ? "" : "s"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 828,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 825,
                                            columnNumber: 15
                                        }, this),
                                        routeSteps.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                            children: routeSteps.map((step, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "step-index",
                                                            children: String.fromCharCode(65 + index)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 838,
                                                            columnNumber: 23
                                                        }, this),
                                                        step.label
                                                    ]
                                                }, step.id, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 837,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 835,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: routeAttempted && startBuilding && endBuilding ? "No tunnel connection found between the selected locations." : "Select a start and destination to preview a tunnel route."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 846,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 824,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "floating-card status-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Status"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 855,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Heating plant passage open until 11:30 PM. Expect increased traffic near Coffman due to event setup."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 856,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 854,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "floating-card layer-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Layers"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 863,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "layer-dot open"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 866,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Winter walkways"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 865,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "layer-dot limited"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 870,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Accessible routes"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 869,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "layer-dot detour"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 874,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Maintenance alerts"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 873,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 864,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 862,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "scale-indicator",
                                    "aria-hidden": "true",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "scale-bar"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 881,
                                            columnNumber: 15
                                        }, this),
                                        "200 ft"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 880,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "map-attribution",
                                    children: "Unofficial visualization. Not for outdoor navigation."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 885,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 816,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 815,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 656,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 624,
        columnNumber: 5
    }, this);
}
_s(HomePage, "oRk3iWFPDkqcahPI/8cq74x/Hqw=");
_c = HomePage;
var _c;
__turbopack_context__.k.register(_c, "HomePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_5ece10c3._.js.map