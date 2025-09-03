import Link from "next/link";
import { auth, signIn, signOut } from "~/server/auth";

/**
 * This is the main home page of the application.
 * As a React Server Component (RSC), it can directly fetch data on the server,
 * making it fast and efficient.
 */
export default async function HomePage() {
  // `auth()` is a server-side function to get the current user's session.
  // This is done before the page is sent to the client.
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Campaign <span className="text-[hsl(280,100%,70%)]">Manager</span> App
        </h1>
        
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-2xl">
            {/* Conditionally render a welcome message based on the session status */}
            {session ? `Welcome, ${session.user.name}!` : "Start to manage your campaigns"}
          </p>

          <div className="flex items-center gap-4">
            {/* If there is no active session, show the Login button */}
            {!session && (
              // This form uses a Server Action to handle the sign-in process.
              <form
                action={async () => {
                  "use server"; // Marks this function to run only on the server.
                  await signIn("github"); // Initiates the GitHub OAuth flow.
                }}
              >
                <button
                  type="submit"
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Login
                </button>
              </form>
            )}

            {/* If a session exists, show the "Panel" and "Logout" buttons */}
            {!!session && (
              <>
                {/* A standard Next.js Link for client-side navigation to the dashboard */}
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Panel
                </Link>
                {/* This form uses a Server Action to handle the sign-out process */}
                <form
                  action={async () => {
                    "use server"; // Marks this function to run only on the server.
                    await signOut();
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full bg-red-600/50 px-10 py-3 font-semibold no-underline transition hover:bg-red-600/70"
                  >
                    Logout
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
