// src/app/_components/navbar.tsx

import Link from "next/link";
import Image from "next/image";
import { auth, signIn, signOut } from "~/server/auth";

// Ana Navbar bileşeni (Server Component)
export default async function Navbar() {
    const session = await auth();
    const user = session?.user;

    return (
        <nav className="flex w-full items-center justify-between bg-gray-800 px-4 py-3 text-white shadow-md sm:px-6 lg:px-8">
            {/* Left Side: Logo/Name of mark */}
            <Link href="/" className="text-xl font-bold text-white no-underline">
                Campaign<span className="text-[hsl(280,100%,70%)]">Manager</span>
            </Link>

            {/* Right Side: User info and buttons */}
            <div className="flex items-center gap-4">
                {user ? <UserMenu user={user} /> : <SignInButton />}
            </div>
        </nav>
    );
}

// User menu (Server Component)
function UserMenu({ user }: { user: { name?: string | null, image?: string | null } }) {
    return (
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-white hover:underline">
                Campaigns
            </Link>

            <Link href="/dashboard/influencers" className="text-sm font-medium text-white hover:underline">
                Influencers
            </Link>

            <div className="h-6 w-px bg-gray-600"></div> {/* Ayırıcı çizgi */}

            {user.image && (
                <Image
                    src={user.image}
                    alt={user.name ?? "User profile"}
                    width={32}
                    height={32}
                    className="rounded-full"
                />
            )}
            <span className="hidden font-medium sm:block">{user.name}</span>
            <SignOutButton />
        </div>
    );
}


// Login button (Client Component)
function SignInButton() {
    return (
        <form
            action={async () => {
                "use server";
                await signIn("github");
            }}
        >
            <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-700"
            >
                Sign In
            </button>
        </form>
    );
}

// Logout button (Client Component)
function SignOutButton() {
    return (
        <form
            action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
            }}
        >
            <button
                type="submit"
                className="rounded-md bg-red-600/80 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-red-600"
            >
                Log Out
            </button>
        </form>
    );
}