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
const DEFAULT_POINT_STYLE = {
    radius: 6,
    color: "#ffffff",
    weight: 2,
    fillColor: "#2563eb",
    fillOpacity: 0.95
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
    GW_ELEVATORS: {
        point: {
            fillColor: "#ef4444",
            color: "#ffffff",
            radius: 5,
            weight: 2
        }
    },
    GW_QR_CODE_LOCS: {
        point: {
            fillColor: "#22d3ee",
            color: "#0f172a",
            radius: 4
        }
    },
    GW_INFO_LABELS: {
        point: {
            fillColor: "#a855f7",
            color: "#ffffff",
            radius: 4
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
    const override = LAYER_STYLE_OVERRIDES[feature] ?? {};
    return {
        polygon: {
            ...DEFAULT_POLYGON_STYLE,
            ...override.polygon ?? {}
        },
        point: {
            ...DEFAULT_POINT_STYLE,
            ...override.point ?? {}
        }
    };
};
const parseDashArray = (value)=>{
    if (!value) return undefined;
    const parts = value.split(/\s+/).map((item)=>Number.parseFloat(item)).filter((item)=>Number.isFinite(item) && item > 0);
    return parts.length > 0 ? parts : undefined;
};
const NODE_COLOR_EXPRESSION = [
    "match",
    [
        "get",
        "nodeType"
    ],
    "academic",
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_COLORS"].academic,
    "student",
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_COLORS"].student,
    "research",
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_COLORS"].research,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_COLORS"].academic
];
const MapView = ({ routePoints, nodes, geoJsonLayers, routeNodeIds, startNodeId, endNodeId })=>{
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
            if (routePoints.length < 2) {
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
                            coordinates: routePoints.map({
                                "MapView.useMemo[routeFeatureCollection]": (point)=>toLonLat(point)
                            }["MapView.useMemo[routeFeatureCollection]"])
                        }
                    }
                ]
            };
        }
    }["MapView.useMemo[routeFeatureCollection]"], [
        routePoints
    ]);
    const nodeFeatureCollection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MapView.useMemo[nodeFeatureCollection]": ()=>{
            const routeSet = new Set(routeNodeIds);
            const features = nodes.filter({
                "MapView.useMemo[nodeFeatureCollection].features": (node)=>routeSet.has(node.id) || node.id === startNodeId || node.id === endNodeId
            }["MapView.useMemo[nodeFeatureCollection].features"]).map({
                "MapView.useMemo[nodeFeatureCollection].features": (node)=>({
                        type: "Feature",
                        properties: {
                            id: node.id,
                            nodeType: node.type,
                            name: node.name,
                            inRoute: routeSet.has(node.id),
                            isStart: startNodeId === node.id,
                            isEnd: endNodeId === node.id
                        },
                        geometry: {
                            type: "Point",
                            coordinates: toLonLat(node.position)
                        }
                    })
            }["MapView.useMemo[nodeFeatureCollection].features"]);
            return {
                type: "FeatureCollection",
                features
            };
        }
    }["MapView.useMemo[nodeFeatureCollection]"], [
        nodes,
        routeNodeIds,
        startNodeId,
        endNodeId
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
        "MapView.useCallback[ensureSources]": ()=>{
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
                    const hasPoints = layer.featureCollection.features.some({
                        "MapView.useCallback[ensureSources].hasPoints": (feature)=>geometryMatches(feature.geometry, "point")
                    }["MapView.useCallback[ensureSources].hasPoints"]);
                    layer.featureCollection.features.forEach({
                        "MapView.useCallback[ensureSources]": (feature)=>{
                            visitGeometry(feature.geometry, {
                                "MapView.useCallback[ensureSources]": (lat, lon)=>extendBounds(bounds, lat, lon)
                            }["MapView.useCallback[ensureSources]"]);
                        }
                    }["MapView.useCallback[ensureSources]"]);
                    if (hasPolygons) {
                        const fillId = `${sourceId}-fill`;
                        const polygonFilter = [
                            "any",
                            [
                                "==",
                                [
                                    "geometry-type"
                                ],
                                "Polygon"
                            ],
                            [
                                "==",
                                [
                                    "geometry-type"
                                ],
                                "MultiPolygon"
                            ]
                        ];
                        map.addLayer({
                            id: fillId,
                            type: "fill",
                            source: sourceId,
                            filter: polygonFilter,
                            paint: {
                                "fill-color": style.polygon.fillColor,
                                "fill-opacity": style.polygon.fillOpacity
                            }
                        });
                        recordLayer(fillId);
                        const outlineId = `${sourceId}-outline`;
                        const linePaint = {
                            "line-color": style.polygon.color,
                            "line-width": style.polygon.weight,
                            "line-opacity": style.polygon.opacity
                        };
                        const dashArray = parseDashArray(style.polygon.dashArray);
                        if (dashArray) {
                            linePaint["line-dasharray"] = dashArray;
                        }
                        map.addLayer({
                            id: outlineId,
                            type: "line",
                            source: sourceId,
                            filter: polygonFilter,
                            paint: linePaint
                        });
                        recordLayer(outlineId);
                    }
                    if (hasLines) {
                        const lineId = `${sourceId}-line`;
                        const lineFilter = [
                            "any",
                            [
                                "==",
                                [
                                    "geometry-type"
                                ],
                                "LineString"
                            ],
                            [
                                "==",
                                [
                                    "geometry-type"
                                ],
                                "MultiLineString"
                            ]
                        ];
                        const linePaint = {
                            "line-color": style.polygon.color,
                            "line-width": Math.max(style.polygon.weight - 0.5, 1),
                            "line-opacity": style.polygon.opacity
                        };
                        const dashArray = parseDashArray(style.polygon.dashArray);
                        if (dashArray) {
                            linePaint["line-dasharray"] = dashArray;
                        }
                        map.addLayer({
                            id: lineId,
                            type: "line",
                            source: sourceId,
                            filter: lineFilter,
                            paint: linePaint
                        });
                        recordLayer(lineId);
                    }
                    if (hasPoints) {
                        layer.featureCollection.features.forEach({
                            "MapView.useCallback[ensureSources]": (feature)=>{
                                visitGeometry(feature.geometry, {
                                    "MapView.useCallback[ensureSources]": (lat, lon)=>extendBounds(bounds, lat, lon)
                                }["MapView.useCallback[ensureSources]"]);
                            }
                        }["MapView.useCallback[ensureSources]"]);
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
            if (nodeFeatureCollection.features.length > 0) {
                map.addSource("tunnel-nodes", {
                    type: "geojson",
                    data: nodeFeatureCollection
                });
                recordSource("tunnel-nodes");
                nodeFeatureCollection.features.forEach({
                    "MapView.useCallback[ensureSources]": (feature)=>{
                        const [lon, lat] = feature.geometry.coordinates;
                        extendBounds(bounds, lat, lon);
                    }
                }["MapView.useCallback[ensureSources]"]);
                const nodeColorExpression = [
                    "case",
                    [
                        "boolean",
                        [
                            "get",
                            "isStart"
                        ],
                        false
                    ],
                    "#22c55e",
                    [
                        "boolean",
                        [
                            "get",
                            "isEnd"
                        ],
                        false
                    ],
                    "#ef4444",
                    [
                        "boolean",
                        [
                            "get",
                            "inRoute"
                        ],
                        false
                    ],
                    "#facc15",
                    NODE_COLOR_EXPRESSION
                ];
                const nodeRadiusExpression = [
                    "case",
                    [
                        "boolean",
                        [
                            "get",
                            "isStart"
                        ],
                        false
                    ],
                    9,
                    [
                        "boolean",
                        [
                            "get",
                            "isEnd"
                        ],
                        false
                    ],
                    9,
                    [
                        "boolean",
                        [
                            "get",
                            "inRoute"
                        ],
                        false
                    ],
                    8,
                    7
                ];
                const nodeStrokeWidthExpression = [
                    "case",
                    [
                        "boolean",
                        [
                            "get",
                            "isStart"
                        ],
                        false
                    ],
                    3,
                    [
                        "boolean",
                        [
                            "get",
                            "isEnd"
                        ],
                        false
                    ],
                    3,
                    [
                        "boolean",
                        [
                            "get",
                            "inRoute"
                        ],
                        false
                    ],
                    2.5,
                    2
                ];
                map.addLayer({
                    id: "tunnel-nodes-circle",
                    type: "circle",
                    source: "tunnel-nodes",
                    paint: {
                        "circle-radius": nodeRadiusExpression,
                        "circle-color": nodeColorExpression,
                        "circle-opacity": 0.95,
                        "circle-stroke-color": "#ffffff",
                        "circle-stroke-width": nodeStrokeWidthExpression
                    }
                });
                recordLayer("tunnel-nodes-circle");
            }
            layerRegistryRef.current = {
                layers: nextLayers,
                sources: nextSources
            };
            if (isBoundsValid(bounds) && !hasFitBoundsRef.current) {
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
        nodeFeatureCollection,
        routeFeatureCollection
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
                                    ensureSourcesRef.current();
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
                        ensureSources();
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
            ensureSources();
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
            lineNumber: 718,
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
        lineNumber: 722,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(MapView, "IVXWrpp4xLzdrVgRar2TjuSRA+s=");
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
    const { data } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$trpc$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].tunnels.mapData.useQuery();
    const { data: arcgisData } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$trpc$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].arcgis.mapData.useQuery();
    const nodes = data?.nodes ?? [];
    const segments = data?.segments ?? [];
    const geoJsonLayers = arcgisData?.layers ?? [];
    const [startBuildingId, setStartBuildingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [endBuildingId, setEndBuildingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [startQuery, setStartQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [endQuery, setEndQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [routeNodeIds, setRouteNodeIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [routeAttempted, setRouteAttempted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const nodeLookup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[nodeLookup]": ()=>new Map(nodes.map({
                "HomePage.useMemo[nodeLookup]": (node)=>[
                        node.id,
                        node
                    ]
            }["HomePage.useMemo[nodeLookup]"]))
    }["HomePage.useMemo[nodeLookup]"], [
        nodes
    ]);
    const adjacency = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[adjacency]": ()=>{
            const map = new Map();
            nodes.forEach({
                "HomePage.useMemo[adjacency]": (node)=>{
                    map.set(node.id, new Set());
                }
            }["HomePage.useMemo[adjacency]"]);
            segments.forEach({
                "HomePage.useMemo[adjacency]": ([from, to])=>{
                    map.get(from)?.add(to);
                    map.get(to)?.add(from);
                }
            }["HomePage.useMemo[adjacency]"]);
            return map;
        }
    }["HomePage.useMemo[adjacency]"], [
        nodes,
        segments
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
            if (nodes.length === 0) {
                return map;
            }
            buildingOptions.forEach({
                "HomePage.useMemo[buildingToNearestNode]": (building)=>{
                    let bestId = null;
                    let bestDistance = Number.POSITIVE_INFINITY;
                    nodes.forEach({
                        "HomePage.useMemo[buildingToNearestNode]": (node)=>{
                            const distance = distanceSquared(building.position, node.position);
                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestId = node.id;
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
        nodes
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
            if (!adjacency.has(startNode) || !adjacency.has(endNode)) {
                return [];
            }
            if (startNode === endNode) {
                return [
                    startNode
                ];
            }
            const queue = [
                startNode
            ];
            const visited = new Set([
                startNode
            ]);
            const parent = new Map();
            parent.set(startNode, null);
            while(queue.length > 0){
                const current = queue.shift();
                if (current === endNode) {
                    break;
                }
                const neighbors = adjacency.get(current);
                if (!neighbors) continue;
                neighbors.forEach({
                    "HomePage.useCallback[computeNodeRoute]": (neighbor)=>{
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            parent.set(neighbor, current);
                            queue.push(neighbor);
                        }
                    }
                }["HomePage.useCallback[computeNodeRoute]"]);
            }
            if (!visited.has(endNode)) {
                return [];
            }
            const path = [];
            let current = endNode;
            while(current){
                path.push(current);
                current = parent.get(current) ?? null;
            }
            path.reverse();
            return path;
        }
    }["HomePage.useCallback[computeNodeRoute]"], [
        adjacency
    ]);
    const routePoints = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routePoints]": ()=>routeNodeIds.map({
                "HomePage.useMemo[routePoints]": (id)=>nodeLookup.get(id)?.position
            }["HomePage.useMemo[routePoints]"]).filter({
                "HomePage.useMemo[routePoints]": (value)=>Array.isArray(value) && value.length === 2
            }["HomePage.useMemo[routePoints]"])
    }["HomePage.useMemo[routePoints]"], [
        routeNodeIds,
        nodeLookup
    ]);
    const routeSteps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[routeSteps]": ()=>{
            if (routeNodeIds.length === 0) {
                return [];
            }
            return routeNodeIds.map({
                "HomePage.useMemo[routeSteps]": (nodeId, index)=>{
                    let label = nodeLookup.get(nodeId)?.name ?? nodeId;
                    if (index === 0 && startBuilding) {
                        label = startBuilding.name;
                    } else if (index === routeNodeIds.length - 1 && endBuilding) {
                        label = endBuilding.name;
                    }
                    return {
                        id: nodeId,
                        label
                    };
                }
            }["HomePage.useMemo[routeSteps]"]);
        }
    }["HomePage.useMemo[routeSteps]"], [
        routeNodeIds,
        nodeLookup,
        startBuilding,
        endBuilding
    ]);
    const routeAvailable = routeNodeIds.length > 1;
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
                                lineNumber: 527,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Campus Sync"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 531,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "brand-subtitle",
                                        children: "UMN Tunnel Explorer"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 532,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 530,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 526,
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
                                lineNumber: 536,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                children: "Search"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 541,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 535,
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
                                lineNumber: 544,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "icon-button",
                                "aria-label": "Settings",
                                children: "☰"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 547,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "avatar",
                                "aria-hidden": "true",
                                children: "NK"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 550,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 543,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 525,
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
                                        lineNumber: 559,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Toggle layers and highlights to plan your trip through the Gopher Way tunnel network."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 560,
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
                                                        lineNumber: 566,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Open tunnels"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 565,
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
                                                        lineNumber: 570,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Limited access"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 569,
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
                                                        lineNumber: 574,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Construction updates"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 573,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 564,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 558,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Plan a route"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 581,
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
                                                        lineNumber: 584,
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
                                                        lineNumber: 585,
                                                        columnNumber: 17
                                                    }, this),
                                                    startSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "route-suggestions",
                                                        children: startSuggestions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>handleStartSuggestionSelect(option),
                                                                    children: option.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 597,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, option.id, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 596,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 594,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 583,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "route-field",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Destination"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 609,
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
                                                        lineNumber: 610,
                                                        columnNumber: 17
                                                    }, this),
                                                    endSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "route-suggestions",
                                                        children: endSuggestions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    onClick: ()=>handleEndSuggestionSelect(option),
                                                                    children: option.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 622,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, option.id, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 621,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 619,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 608,
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
                                                        lineNumber: 634,
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
                                                        lineNumber: 642,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 633,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "route-summary",
                                                children: routeSummary
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 657,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 582,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                                        id: "building-options-list",
                                        children: buildingOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: option.name
                                            }, option.id, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 661,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 659,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 580,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Popular connections"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 667,
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
                                                            lineNumber: 678,
                                                            columnNumber: 21
                                                        }, this),
                                                        route.label
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 671,
                                                    columnNumber: 19
                                                }, this)
                                            }, `${route.startId}-${route.endId}`, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 670,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 668,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 666,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "panel-section tunnel-legend",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Segment legend"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 689,
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
                                                        lineNumber: 692,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Open underground connector"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 691,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-line detour",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 696,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Winter route detour"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 695,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-dot academic",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 700,
                                                        columnNumber: 17
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_TYPE_LABEL"].academic
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 699,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-dot student",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 704,
                                                        columnNumber: 17
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_TYPE_LABEL"].student
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 703,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "legend-dot research",
                                                        "aria-hidden": "true"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 708,
                                                        columnNumber: 17
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$tunnels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NODE_TYPE_LABEL"].research
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 707,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 690,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 688,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 557,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "map-area",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "map-canvas",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$map$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapView"], {
                                    routePoints: routePoints,
                                    nodes: nodes,
                                    geoJsonLayers: geoJsonLayers,
                                    routeNodeIds: routeNodeIds,
                                    startNodeId: startNodeId,
                                    endNodeId: endNodeId
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 717,
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
                                                    lineNumber: 728,
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
                                                    lineNumber: 730,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 727,
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
                                                            lineNumber: 740,
                                                            columnNumber: 23
                                                        }, this),
                                                        step.label
                                                    ]
                                                }, step.id, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 739,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 737,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: routeAttempted && startBuildingId && endBuildingId ? "No tunnel connection found between the selected locations." : "Select a start and destination to preview a tunnel route."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 748,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 726,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "floating-card status-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Status"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 757,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Heating plant passage open until 11:30 PM. Expect increased traffic near Coffman due to event setup."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 758,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 756,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "floating-card layer-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Layers"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 765,
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
                                                            lineNumber: 768,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Winter walkways"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 767,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "layer-dot limited"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 772,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Accessible routes"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 771,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "layer-dot detour"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/page.tsx",
                                                            lineNumber: 776,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Maintenance alerts"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 775,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 766,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 764,
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
                                            lineNumber: 783,
                                            columnNumber: 15
                                        }, this),
                                        "200 ft"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 782,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "map-attribution",
                                    children: "Unofficial visualization. Not for outdoor navigation."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 787,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 716,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 715,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 556,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 524,
        columnNumber: 5
    }, this);
}
_s(HomePage, "uG+L6brVzDb27hPC8cB3xete8Mg=");
_c = HomePage;
var _c;
__turbopack_context__.k.register(_c, "HomePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_5ece10c3._.js.map