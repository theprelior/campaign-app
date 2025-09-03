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

// =================================================================================
// AUTHENTICATION TABLES (Required by NextAuth.js)
// These tables are part of the Drizzle adapter for NextAuth.js.
// It's generally best not to modify them unless you know what you're doing.
// =================================================================================

/**
 * Stores user profile information. Linked to accounts and sessions.
 */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

/**
 * Links OAuth accounts (e.g., GitHub, Google) to a user in the `users` table.
 */
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // If a user is deleted, their accounts are also deleted.
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
    // A user can only have one account per provider (e.g., one GitHub account).
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

/**
 * Stores user session information, linking a session to a user.
 */
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // If a user is deleted, their sessions are also deleted.
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/**
 * Used for "magic link" email sign-ins.
 */
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


// =================================================================================
// APPLICATION-SPECIFIC TABLES
// These tables define the core data structure for our Campaign Management app.
// =================================================================================

/**
 * Represents a single marketing campaign.
 */
export const campaigns = pgTable(
  "campaign",
  {
    id: serial("id").primaryKey(), // Auto-incrementing integer ID.
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description"),
    budget: integer("budget").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    // Foreign key linking this campaign to a user.
    userId: text("user_id") 
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // If a user is deleted, their campaigns are also deleted.
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (campaign) => ({
    // An index on the userId column to speed up queries for a user's campaigns.
    userIdIndex: index("campaign_user_id_idx").on(campaign.userId),
  })
);

/**
 * Represents a single influencer.
 */
export const influencers = pgTable("influencer", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  followerCount: integer("follower_count").notNull(),
  // `decimal` is used for precision, suitable for rates or financial data.
  // Precision: total number of digits. Scale: number of digits after the decimal point.
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).notNull(), 
});

/**
 * This is a "junction table" or "join table" that creates a many-to-many relationship
 * between the `campaigns` and `influencers` tables.
 */
export const campaignsToInfluencers = pgTable(
  "campaigns_to_influencers",
  {
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }), // If a campaign is deleted, the link is removed.
    influencerId: integer("influencer_id")
      .notNull()
      .references(() => influencers.id, { onDelete: "cascade" }), // If an influencer is deleted, the link is removed.
  },
  (t) => ({
    // A composite primary key ensures that the same influencer cannot be assigned to the same campaign more than once.
    pk: primaryKey({ columns: [t.campaignId, t.influencerId] }),
  })
);

// =================================================================================
// RELATIONS
// This section tells Drizzle how the tables are related to each other,
// which allows us to perform powerful relational queries.
// =================================================================================

/**
 * A user can have many campaigns (one-to-many relationship).
 */
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
}));

/**
 * A campaign belongs to one user (one-to-many relationship, reversed).
 * A campaign can also have many influencers through the junction table.
 */
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  campaignsToInfluencers: many(campaignsToInfluencers),
}));

/**
 * An influencer can be part of many campaigns through the junction table.
 */
export const influencersRelations = relations(influencers, ({ many }) => ({
  campaignsToInfluencers: many(campaignsToInfluencers),
}));

/**
 * Defines the relationships from the junction table back to the main tables.
 * This allows us to query from Campaign -> Influencer and from Influencer -> Campaign.
 */
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
