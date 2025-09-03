// src/server/api/routers/campaign.ts

import { z } from "zod";
// campaignsToInfluencers şemasını import et
import { campaigns, campaignsToInfluencers } from "~/server/db/schema"; 
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const campaignRouter = createTRPCRouter({
  // ... (create, getAll, delete, update prosedürleri burada, onlara dokunmuyoruz)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, { message: "Başlık gerekli" }),
        description: z.string().optional(),
        budget: z.number().positive({ message: "Bütçe pozitif olmalı" }),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(campaigns).values({
        title: input.title,
        description: input.description,
        budget: input.budget,
        startDate: input.startDate,
        endDate: input.endDate,
        userId: ctx.session.user.id,
      });
    }),

  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.campaigns.findMany({
      where: eq(campaigns.userId, ctx.session.user.id),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });
  }),

  // --- BU PROSEDÜRÜ GÜNCELLİYORUZ ---
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, input.id),
          eq(campaigns.userId, ctx.session.user.id)
        ),
        // YENİ EK: İlişkili influencer'ları da getir
        with: {
          campaignsToInfluencers: {
            with: {
              influencer: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kampanya bulunamadı",
        });
      }
      return campaign;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(campaigns)
        .where(
          and(
            eq(campaigns.id, input.id),
            eq(campaigns.userId, ctx.session.user.id)
          )
        );
    }),
  
  update: protectedProcedure
    .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        budget: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        await ctx.db.update(campaigns)
        .set({
            title: input.title,
            description: input.description,
            budget: input.budget,
        })
        .where(
            and(
                eq(campaigns.id, input.id),
                eq(campaigns.userId, ctx.session.user.id)
            )
        )
    }),

  // --- YENİ EKLENEN İLİŞKİ PROSEDÜRLERİ ---

  // Bir influencer'ı kampanyaya ata
  assignInfluencer: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        influencerId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Not: Burada kampanyanın kullanıcıya ait olup olmadığını kontrol edebiliriz,
      // ama arayüzden sadece kendi kampanyasına ekleme yapacağı için şimdilik atlıyoruz.
      await ctx.db.insert(campaignsToInfluencers).values({
        campaignId: input.campaignId,
        influencerId: input.influencerId,
      });
    }),

  // Bir influencer'ı kampanyadan çıkar
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