module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/server/api/trpc.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCallerFactory",
    ()=>createCallerFactory,
    "createTRPCContext",
    ()=>createTRPCContext,
    "createTRPCRouter",
    ()=>createTRPCRouter,
    "publicProcedure",
    ()=>publicProcedure
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$initTRPC$2d$CB9uBez5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/initTRPC-CB9uBez5.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$superjson$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/superjson/dist/esm/index.js [app-route] (ecmascript)");
;
;
const createTRPCContext = (_opts)=>{
    return {};
};
const t = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$initTRPC$2d$CB9uBez5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initTRPC"].context().create({
    transformer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$superjson$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"],
    errorFormatter ({ shape }) {
        return shape;
    }
});
const createTRPCRouter = t.router;
const publicProcedure = t.procedure;
const createCallerFactory = t.createCallerFactory;
}),
"[project]/src/server/data/tunnels.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ROUTE_HIGHLIGHT",
    ()=>ROUTE_HIGHLIGHT,
    "TUNNEL_NODES",
    ()=>TUNNEL_NODES,
    "TUNNEL_SEGMENTS",
    ()=>TUNNEL_SEGMENTS
]);
const TUNNEL_NODES = [
    {
        id: "northrop",
        name: "Northrop",
        position: [
            44.973988,
            -93.23237
        ],
        type: "academic"
    },
    {
        id: "morrill",
        name: "Morrill Hall",
        position: [
            44.973751,
            -93.231247
        ],
        type: "academic"
    },
    {
        id: "walter",
        name: "Walter Library",
        position: [
            44.974711,
            -93.231774
        ],
        type: "academic"
    },
    {
        id: "lind",
        name: "Lind Hall",
        position: [
            44.975258,
            -93.232522
        ],
        type: "academic"
    },
    {
        id: "keller",
        name: "Keller Hall",
        position: [
            44.975101,
            -93.22956
        ],
        type: "research"
    },
    {
        id: "stss",
        name: "Science Teaching & Student Services",
        position: [
            44.972983,
            -93.22745
        ],
        type: "student"
    },
    {
        id: "coffman",
        name: "Coffman Memorial Union",
        position: [
            44.972712,
            -93.235466
        ],
        type: "student"
    },
    {
        id: "peik",
        name: "Peik Hall",
        position: [
            44.972326,
            -93.226106
        ],
        type: "academic"
    },
    {
        id: "anderson",
        name: "Anderson Hall",
        position: [
            44.972708,
            -93.23026
        ],
        type: "academic"
    },
    {
        id: "weisman",
        name: "Weisman Art Museum",
        position: [
            44.972671,
            -93.230991
        ],
        type: "student"
    }
];
const TUNNEL_SEGMENTS = [
    [
        "northrop",
        "morrill"
    ],
    [
        "morrill",
        "walter"
    ],
    [
        "walter",
        "lind"
    ],
    [
        "lind",
        "keller"
    ],
    [
        "walter",
        "stss"
    ],
    [
        "stss",
        "coffman"
    ],
    [
        "coffman",
        "anderson"
    ],
    [
        "anderson",
        "stss"
    ],
    [
        "stss",
        "peik"
    ],
    [
        "coffman",
        "weisman"
    ]
];
const ROUTE_HIGHLIGHT = [
    "northrop",
    "morrill",
    "walter",
    "stss",
    "coffman"
];
}),
"[project]/src/server/api/routers/tunnels.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "tunnelRouter",
    ()=>tunnelRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$data$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/data/tunnels.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/api/trpc.ts [app-route] (ecmascript)");
;
;
;
const tunnelRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    mapData: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publicProcedure"].query(()=>({
            nodes: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$data$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TUNNEL_NODES"],
            segments: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$data$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TUNNEL_SEGMENTS"],
            highlightRoute: [
                ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$data$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ROUTE_HIGHLIGHT"]
            ]
        })),
    nodeById: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publicProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).query(({ input })=>{
        const node = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$data$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TUNNEL_NODES"].find((item)=>item.id === input.id);
        if (!node) {
            return null;
        }
        return node;
    })
});
}),
"[project]/src/server/api/root.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appRouter",
    ()=>appRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/api/trpc.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$routers$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/api/routers/tunnels.ts [app-route] (ecmascript)");
;
;
const appRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    tunnels: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$routers$2f$tunnels$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tunnelRouter"]
});
}),
"[project]/src/app/api/trpc/[trpc]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>handler,
    "POST",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$fetch$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/adapters/fetch/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/api/root.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/api/trpc.ts [app-route] (ecmascript)");
;
;
;
const handler = (request)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$fetch$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchRequestHandler"])({
        endpoint: "/api/trpc",
        req: request,
        router: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appRouter"],
        createContext: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$api$2f$trpc$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCContext"]
    });
;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6fbfee49._.js.map