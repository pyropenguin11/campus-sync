import { initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

export const createTRPCContext = (_opts: FetchCreateContextFnOptions) => {
  return {};
};

type CreateContextReturnType = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<CreateContextReturnType>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
