// src/server/api/routers/influencer.ts

import { z } from "zod";
import { influencers } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { eq } from "drizzle-orm";

export const influencerRouter = createTRPCRouter({
  
  // Yeni bir influencer oluştur
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
        engagementRate: input.engagementRate.toString(), // Drizzle decimal için string'e çevir
      });
    }),

  // Tüm influencer'ları listele
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.influencers.findMany({
      orderBy: (influencers, { asc }) => [asc(influencers.name)],
    });
  }),
  
  // Bir influencer'ı güncelle
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

  // Bir influencer'ı sil
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(influencers)
        .where(eq(influencers.id, input.id));
    }),
});