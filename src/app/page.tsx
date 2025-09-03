// src/app/page.tsx

import Link from "next/link";
import { auth, signIn, signOut } from "~/server/auth";

export default async function HomePage() {
  // Bu bir Server Component olduğu için session bilgisini doğrudan 'auth' ile alabiliriz.
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Campaign <span className="text-[hsl(280,100%,70%)]">Manager</span> App
        </h1>
        
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-2xl">
            {session ? `Welcome, ${session.user.name}!` : "Start to manage your campaigns"}
          </p>

          {/* AuthShowcase: Giriş/Çıkış Butonları */}
          <div className="flex items-center gap-4">
            {!session && (
              // Oturum yoksa: Giriş Yap Butonu
              <form
                action={async () => {
                  "use server";
                  await signIn("github"); // GitHub provider'ı ile giriş yap
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

            {!!session && (
              // Oturum varsa: Panele Git ve Çıkış Yap Butonları
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
                >
                  Panel
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full bg-red-600/50 px-10 py-3 font-semibold no-underline transition hover:bg-red-600/70"
                  >
                    Çıkış Yap
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