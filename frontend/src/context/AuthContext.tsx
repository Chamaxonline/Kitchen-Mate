"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth, getStoredAuth, storeAuth, type AuthUser } from "@/lib/auth";
import { login as apiLogin, registerTenant as apiRegister } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    restaurantName: string;
    slug: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
  }) => Promise<void>;
  logout: () => void;
  isManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getStoredAuth());
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const auth = await apiLogin(email, password);
        storeAuth(auth);
        setUser(auth);
        router.push("/");
      },
      async register(body) {
        const auth = await apiRegister(body);
        storeAuth(auth);
        setUser(auth);
        router.push("/");
      },
      logout() {
        clearAuth();
        setUser(null);
        router.push("/login");
      },
      isManager: user?.role === "Manager" || user?.role === "Admin",
      isAdmin: user?.role === "Admin",
    }),
    [user, loading, router],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
