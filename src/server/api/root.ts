import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { campaignRouter } from "./routers/campaign"; // Bu satırı ekleyin
import { influencerRouter } from "./routers/influencer"; // Bu satırı ekle

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  campaign: campaignRouter, // Bu satırı ekleyin
  influencer: influencerRouter, 
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
