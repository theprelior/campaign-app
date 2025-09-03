# Campaign Management Mini-App

This project is a small full-stack web application that simulates a mini campaign management tool. It was built using a modern tech stack including Next.js, tRPC, Supabase, and Drizzle.

## 🚀 Live Demo

[Link to your Vercel deployment will go here]

## ✨ Features

  - **Authentication:** Secure user sign-up and login via GitHub OAuth.
  - **Campaign Management:** Users can create, list, update, and delete their own campaigns (Full CRUD).
  - **Influencer Management:** A dedicated section to add, edit, and delete influencers.
  - **Assignment Operations:** Easily assign influencers to campaigns and remove them.
  - **Responsive UI:** A modern and user-friendly interface that is compatible with both mobile and desktop devices.

## 🛠️ Tech Stack

  - **Framework:** Next.js (App Router)
  - **API Layer:** tRPC
  - **Database:** Supabase (PostgreSQL)
  - **ORM:** Drizzle ORM
  - **Authentication:** NextAuth.js
  - **Styling:** Tailwind CSS
  - **Language:** TypeScript

## 🚀 Getting Started

To run this project on your local machine, follow the steps below.

**1. Clone the Repository:**

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

**2. Install Dependencies:**

```bash
npm install
```

**3. Set Up Environment Variables:**
Create a `.env` file in the root of the project and add the following variables. It's recommended to copy the structure from a `.env.example` file.

```env
# Get this from your Supabase Project > Project Settings > Database > Connection string > URI
# Replace [YOUR-PASSWORD] with your database password
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres"

# A secret key for NextAuth.js. You can generate one with the command: `openssl rand -base64 32`
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Your GitHub OAuth App credentials
# Create one at https://github.com/settings/developers
# The Authorization callback URL should be: http://localhost:3000/api/auth/callback/github
AUTH_GITHUB_ID="your_github_client_id"
AUTH_GITHUB_SECRET="your_github_client_secret"
```

**4. Push the Database Schema:**
This command will sync your Drizzle schema with your Supabase database.

```bash
npm run db:push
```

**5. Start the Development Server:**

```bash
npm run dev
```

Your application should now be running at [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).