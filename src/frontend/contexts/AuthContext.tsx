"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
  needsRegistration?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // サーバーサイドのセッションAPIから最新情報を取得する
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Auth session fetch error:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    
    // 定期的なセッション確認（Supabase クライアントを使用しないための代替案）
    const interval = setInterval(refreshUser, 1000 * 60 * 5); // 5分おき
    return () => clearInterval(interval);
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/'; // ログアウト後はトップへ強制遷移
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  return useContext(AuthContext);
}
