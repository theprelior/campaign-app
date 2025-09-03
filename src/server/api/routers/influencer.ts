import { z } from "zod";
import { influencers } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";

/**
 * This is the tRPC router for all influencer-related API procedures.
 * All procedures here are protected, meaning they require the user to be authenticated.
 */
export const influencerRouter = createTRPCRouter({
  
  /**
   * Mutation to create a new influencer.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        followerCount: z.number().positive(),
        engagementRate: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(influencers).values({
        name: input.name,
        followerCount: input.followerCount,
        // Drizzle ORM requires decimal types to be inserted as strings for precision.
        engagementRate: input.engagementRate.toString(),
      });
    }),

  /**
   * Query to get all influencers available in the system.
   * The results are ordered by name in ascending order.
   */
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.influencers.findMany({
      orderBy: (influencers, { asc }) => [asc(influencers.name)],
    });
  }),
  
  /**
   * Mutation to update an influencer's details by their ID.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        followerCount: z.number().positive().optional(),
        engagementRate: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(influencers)
        .set({
          name: input.name,
          followerCount: input.followerCount,
          engagementRate: input.engagementRate?.toString(),
        })
        .where(eq(influencers.id, input.id));
    }),

  /**
   * Mutation to delete an influencer by their ID.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(influencers)
        .where(eq(influencers.id, input.id));
    }),
});
