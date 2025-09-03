// src/app/_components/navbar.tsx

"use client"; // State kullanacağımız için client component'e çeviriyoruz

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react"; // useSession hook'unu kullanıyoruz
import { signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  
  // Mobil menünün açık/kapalı durumunu tutacak state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-gray-800 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Sol Taraf: Logo/Marka Adı */}
        <Link 
          href="/" 
          className="text-xl font-bold text-white no-underline"
          onClick={() => setIsMenuOpen(false)} // Logoya tıklayınca menüyü kapat
        >
          Campaign<span className="text-[hsl(280,100%,70%)]">Manager</span>
        </Link>

        {/* Orta/Büyük Ekran Menüsü (Desktop Menu) */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? <UserMenu user={user} /> : <SignInButton />}
        </div>

        {/* Mobil Ekran Hamburger Butonu */}
        <div className="md:hidden">
          {user && (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? (
                // Kapatma ikonu (X)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger ikonu (☰)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Açılır Mobil Menü */}