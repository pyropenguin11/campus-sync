import { createTRPCRouter } from "@/server/api/trpc";
import { tunnelRouter } from "@/server/api/routers/tunnels";

export const appRouter = createTRPCRouter({
  tunnels: tunnelRouter,
});

export type AppRouter = typeof appRouter;
