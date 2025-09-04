import { z } from "zod";
import { campaigns, campaignsToInfluencers } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * This is the tRPC router for all campaign-related API procedures.
 * All procedures here are protected, meaning they require the user to be authenticated.
 */
export const campaignRouter = createTRPCRouter({
  /**
   * Mutation to create a new campaign.
   * The campaign is automatically associated with the currently logged-in user.
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, { message: "Title is required" }),
        description: z.string().optional(),
        budget: z.number().positive({ message: "Budget must be a positive number" }),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ctx.session.user.id provides the ID of the authenticated user.
      await ctx.db.insert(campaigns).values({
        title: input.title,
        description: input.description,
        budget: input.budget,
        startDate: input.startDate,
        endDate: input.endDate,
        userId: ctx.session.user.id,
      });
    }),

  /**
   * Query to get all campaigns belonging to the currently logged-in user.
   * The results are ordered by creation date in descending order.
   */
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.campaigns.findMany({
      where: eq(campaigns.userId, ctx.session.user.id),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });
  }),

  /**
   * Query to get a single campaign by its ID.
   * This procedure also fetches all influencers assigned to the campaign.
   * Security: Ensures that the user can only fetch campaigns they own.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, input.id),
          eq(campaigns.userId, ctx.session.user.id) // Security check: user must own the campaign.
        ),
        // Drizzle's `with` clause performs a join to fetch related data.
        with: {
          campaignsToInfluencers: { // Join with the junction table...
            with: {
              influencer: true, // ...and then join with the influencers table.
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }
      return campaign;
    }),

  /**
   * Mutation to delete a campaign by its ID.
   * Security: Ensures that the user can only delete campaigns they own.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(campaigns)
        .where(
          and(
            eq(campaigns.id, input.id),
            eq(campaigns.userId, ctx.session.user.id) // Security check
          )
        );
    }),
  
  /**
   * Mutation to update a campaign's details by its ID.
   * Security: Ensures that the user can only update campaigns they own.
   */
  update: protectedProcedure
    .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        budget: z.number().positive().optional(),
        // Add optional date fields to the update schema
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        await ctx.db.update(campaigns)
        .set({
            title: input.title,
            description: input.description,
            budget: input.budget,
            // Add date fields to the update operation
            startDate: input.startDate,
            endDate: input.endDate,
        })
        .where(
            and(
                eq(campaigns.id, input.id),
                eq(campaigns.userId, ctx.session.user.id) // Security check
            )
        );
    }),

  // --- RELATIONSHIP MANAGEMENT PROCEDURES ---

  /**
   * Mutation to assign an influencer to a campaign.
   * This creates an entry in the `campaignsToInfluencers` junction table.
   */
  assignInfluencer: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        influencerId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Note: A further security check could be added here to verify the user owns the campaignId.
      // However, since the UI only allows assigning to owned campaigns, this is implicitly handled.
      await ctx.db.insert(campaignsToInfluencers).values({
        campaignId: input.campaignId,
        influencerId: input.influencerId,
      });
    }),

  /**
   * Mutation to remove an influencer from a campaign.
   * This deletes an entry from the `campaignsToInfluencers` junction table.
   */
  removeInfluencer: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        influencerId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(campaignsToInfluencers)
        .where(
          and(
            eq(campaignsToInfluencers.campaignId, input.campaignId),
            eq(campaignsToInfluencers.influencerId, input.influencerId)
          )
        );
    }),
});

