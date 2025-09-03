# Developer Documentation: Campaign Management App

This document chronicles the step-by-step process of the development, debugging, and deployment of the "Campaign Management Mini-App" project from scratch. Its purpose is to detail the technical decisions made, the challenges encountered, and the solutions implemented throughout the development lifecycle.

## Phase 1: Project Initialization and Infrastructure Setup

In this phase, the project's foundation was laid, and the development environment was prepared.

### Step 1.1: Tech Stack Selection and Project Creation

To build a modern and efficient infrastructure best suited for the project's requirements, the **T3 Stack** methodology was chosen.
The project was initialized using the `create-t3-app` CLI tool with the following command:

```bash
npx create-t-app@latest campaign-app
```

The technologies selected during setup were:

  - **Framework:** Next.js (with App Router)
  - **Language:** TypeScript
  - **API Layer:** tRPC
  - **ORM:** Drizzle ORM
  - **Authentication:** NextAuth.js
  - **Styling:** Tailwind CSS

### Step 1.2: Environment Variable Setup

The necessary secrets and connection strings for the application were added to a `.env` file in the project root.

  - **`DATABASE_URL`:** The database connection string obtained from the Supabase project.
  - **`NEXTAUTH_SECRET`:** A secret key generated with the `openssl` command to secure NextAuth.js sessions.
  - **`NEXTAUTH_URL`:** Set to `http://localhost:3000` for the local development environment.
  - **`AUTH_GITHUB_ID` & `AUTH_GITHUB_SECRET`:** Credentials from the GitHub OAuth App created for authentication.

## Phase 2: Database Architecture

In this phase, the application's data structure was defined using Drizzle ORM and migrated to the Supabase database.

https://supabase.com/

### Step 2.1: Defining the Database Schema

In the `src/server/db/schema.ts` file, the tables and their relationships required for the application were defined:

  - **NextAuth Tables:** The standard `users`, `accounts`, `sessions`, and `verificationTokens` tables were included.
  - **`campaigns` Table:** Stores campaign information (e.g., `title`, `description`, `budget`) and is linked to the `users` table via `userId`.
  - **`influencers` Table:** Stores influencer information (e.g., `name`, `followerCount`, `engagementRate`).
  - **`campaignsToInfluencers` Table:** A junction table to establish the many-to-many relationship between campaigns and influencers.

### Step 2.2: Database Migration

Using Drizzle Kit, a SQL migration file was generated from the defined schema and pushed to the Supabase database instance.

```bash
npm run db:generate
npm run db:push
```

## Phase 3: Backend Development (tRPC API)

The application's core business logic was developed as type-safe API endpoints using tRPC.

### Step 3.1: Campaign Management API (`campaignRouter`)

  - **CRUD Operations:** `create`, `getAll`, `getById`, `update`, and `delete` procedures were created.
  - **Security:** All procedures were defined as `protectedProcedure`, and a `userId` check was included in each to ensure users could only operate on their own campaigns.

### Step 3.2: Influencer Management API (`influencerRouter`)

  - **CRUD Operations:** `create`, `getAll`, `update`, and `delete` procedures were created to manage influencers.

### Step 3.3: Relationship Management API

  - **Assignment & Removal:** Two new mutations, `assignInfluencer` and `removeInfluencer`, were added to the `campaignRouter` to manage assignments.
  - **Data Fetching:** The `getById` procedure in `campaignRouter` was updated using Drizzle's `with` feature to also fetch associated influencers when retrieving a single campaign.

## Phase 4: Frontend Development (Next.js & React)

The user-facing interfaces were built using the Next.js App Router structure and React components.

### Step 4.1: Main Layout and Navigation

  - **`Navbar` Component:** A reusable navigation bar component (`navbar.tsx`) was created for use across all pages. This component displays different content based on the user's authentication status (a "Sign In" button or a user menu).
  - **Main `layout.tsx`:** The created `Navbar` was added to the root layout file, making it visible on all pages.

### Step 4.2: Interface Development

  - **`/dashboard`:** The main dashboard page, featuring a list of campaigns and a form to create new campaigns.
  - **`/dashboard/influencers`:** The page for listing and managing (CRUD) influencers.
  - **`/dashboard/campaign/[id]`:** The dynamic campaign detail page, created using a dynamic route. This page displays campaign details, Edit/Delete buttons, a list of assigned influencers, and an interface for assigning new influencers.
  - **tRPC Hooks:** All these interfaces utilized tRPC's React Query hooks (`useQuery`, `useMutation`) to communicate with the backend in a type-safe manner.

## Phase 5: Styling and Responsive Design

Tailwind CSS's responsive design features were used to ensure the application looks great on all devices.

  - **Responsive Grid:** The campaign and influencer lists were designed with a grid structure to display a single column on mobile devices and multiple columns on larger screens.
  - **Responsive Navbar:** The Navbar was updated to display a standard menu on desktop screens and collapse into a "hamburger menu" on tablet and mobile sizes (below the `lg` breakpoint). This functionality was managed using the `useState` hook.

## Phase 6: Deployment and Debugging

After completing the development, the process of deploying the application to Vercel began. This phase was the most challenging and educational part of the project.

### Step 6.1: Vercel Setup and Initial Errors

  - **`DATABASE_URL` Error:** An `Invalid url` error caused by an incorrect format of the `DATABASE_URL` in Vercel was resolved by removing quotes and handling special characters.
  - **`localhost` Error:** It was understood that a deployed project cannot connect to `localhost`, establishing that the `DATABASE_URL` must always be the public Supabase address.

### Step 6.2: Persistent Build Errors

  - **TypeScript Type Error (`PageProps`):** Due to an unstable version of Next.js (`15.x`) being used, a persistent type error occurred during the Vercel production build. After multiple attempts, the issue was resolved at its root by downgrading the project's Next.js version to a stable release (`14.x`).
  - **Syntax Error:** A typo introduced during a copy-paste operation in the `navbar.tsx` file caused an `Unexpected token` error. The issue was resolved by replacing the file's content with a clean, verified version.

### Step 6.3: Runtime Errors

  - **`getaddrinfo ENOTFOUND` Error:**
      - **Diagnosis:** It was determined that there was a regional access block to the Supabase database address from both the local machine (in Turkey) and Vercel's servers (in Istanbul).
      - **Solution:** The `DATABASE_URL` was updated to use the **Connection Pooler** string provided by Supabase, which is not affected by regional blocks. This permanently solved the issue.
  - **`CallbackRouteError` and `invalid_grant` Error:**
      - **Diagnosis:** An error occurred during the callback step after logging in with GitHub. The cause was identified as an inconsistency in the environment variables.
      - **Solution:** It was discovered that the secret variable name had changed from `AUTH_SECRET` to **`NEXTAUTH_SECRET`** with NextAuth.js v5. Correcting this naming error and performing a final verification of all other variables resolved the problem.

