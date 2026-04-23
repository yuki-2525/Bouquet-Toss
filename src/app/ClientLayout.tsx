"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "@/frontend/components/UserMenu";
import { ThemeToggle } from "@/frontend/components/ThemeToggle";
import { Footer } from "@/frontend/components/Footer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOverlay = pathname?.includes("/overlay");

  return (
    <>
      {!isOverlay && (
        <header className="fixed top-0 left-0 w-full z-50 pointer-events-none">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-end items-center gap-3 pointer-events-auto">
            <UserMenu />
            <ThemeToggle />
          </div>
        </header>
      )}
      <div className={`flex flex-col min-h-screen ${!isOverlay ? "pt-16" : ""}`}>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
