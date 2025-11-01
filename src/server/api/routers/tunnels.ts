import { z } from "zod";
import {
  ROUTE_HIGHLIGHT,
  TUNNEL_NODES,
  TUNNEL_SEGMENTS,
} from "@/server/data/tunnels";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const tunnelRouter = createTRPCRouter({
  mapData: publicProcedure.query(() => ({
    nodes: TUNNEL_NODES,
    segments: TUNNEL_SEGMENTS,
    highlightRoute: [...ROUTE_HIGHLIGHT],
  })),
  nodeById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const node = TUNNEL_NODES.find((item) => item.id === input.id);
      if (!node) {
        return null;
      }
      return node;
    }),
});
