import { createTRPCRouter } from "@/server/api/trpc";
import { arcgisRouter } from "@/server/api/routers/arcgis";
import { tunnelRouter } from "@/server/api/routers/tunnels";

export const appRouter = createTRPCRouter({
  arcgis: arcgisRouter,
  tunnels: tunnelRouter,
});

export type AppRouter = typeof appRouter;
