// src/server/db/schema.ts

import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

// --- NEXTAUTH.JS TABLOLARI (DOKUNMAYIN) ---
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- KENDİ TABLOLARIMIZ ---

export const campaigns = pgTable(
  "campaign",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description"),
    budget: integer("budget").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    userId: text("user_id") // Bu satır önemli!
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (example) => ({
    userIdIndex: index("campaign_user_id_idx").on(example.userId),
  })
);

export const influencers = pgTable("influencer", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  followerCount: integer("follower_count").notNull(),
  // precision: toplam basamak sayısı, scale: ondalık sonrası basamak sayısı
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).notNull(), 
});

// Çoka-çok ilişki için ara tablo (Junction Table)
export const campaignsToInfluencers = pgTable(
  "campaigns_to_influencers",
  {
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    influencerId: integer("influencer_id")
      .notNull()
      .references(() => influencers.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.campaignId, t.influencerId] }),
  })
);

// --- İLİŞKİLER (RELATIONS) ---

// Bir kullanıcının birden çok kampanyası olabilir
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
}));

// Bir kampanyanın bir kullanıcısı vardır ve birden çok influencer'ı olabilir
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  campaignsToInfluencers: many(campaignsToInfluencers),
}));

// Bir influencer'ın birden çok kampanyası olabilir
export const influencersRelations = relations(influencers, ({ many }) => ({
    campaignsToInfluencers: many(campaignsToInfluencers),
}));

// Ara tablonun ilişkileri
export const campaignsToInfluencersRelations = relations(
  campaignsToInfluencers,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignsToInfluencers.campaignId],
      references: [campaigns.id],
    }),
    influencer: one(influencers, {
      fields: [campaignsToInfluencers.influencerId],
      references: [influencers.id],
    }),
  })
);