"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { AuthProvider } from "@/frontend/contexts/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
