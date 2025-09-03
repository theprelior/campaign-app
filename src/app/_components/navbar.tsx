// src/app/_components/navbar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-gray-800 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="text-xl font-bold text-white no-underline"
          onClick={() => setIsMenuOpen(false)}
        >
          Campaign<span className="text-[hsl(280,100%,70%)]">Manager</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-4 lg:flex">
          {user ? <UserMenu user={user} /> : <SignInButton />}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden">
          {user && (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          )}
          {!user && <SignInButton />}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && user && (
        <div className="lg:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="flex flex-col items-center gap-4 px-4 pb-4 pt-2 border-t border-gray-700">
             <UserMenu user={user} isMobile={true} />
          </div>
        </div>
      )}
    </nav>
  );
}

function UserMenu({ user, isMobile = false }: { user: { name?: string | null, image?: string | null }, isMobile?: boolean }) {
  const containerClasses = isMobile ? "flex flex-col items-center gap-4" : "flex items-center gap-4";
  
  return (
    <div className={containerClasses}>
      <Link href="/dashboard" className="text-sm font-medium text-white hover:underline">
        Kampanyalar
      </Link>
      <Link href="/dashboard/influencers" className="text-sm font-medium text-white hover:underline">
        Influencers
      </Link>

      <div className={isMobile ? "w-full border-t border-gray-700 my-2" : "h-6 w-px bg-gray-600"}></div>

      <div className="flex items-center gap-2">
        {user.image && (
          <Image
            src={user.image}
            alt={user.name ?? "Kullanıcı profili"}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="font-medium">{user.name}</span>
      </div>
      <SignOutButton />
    </div>
  );
}

function SignInButton() {
  return <button onClick={() => signIn("github")} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-700">Giriş Yap</button>;
}

function SignOutButton() {
  return <button onClick={() => signOut({ redirectTo: "/" })} className="w-full rounded-md bg-red-600/80 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-red-600 sm:w-auto">Çıkış Yap</button>;
}