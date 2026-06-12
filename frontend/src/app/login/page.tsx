"use client";

import Link from "next/link";
import { useState } from "react";
import { ChefHat, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const demoAccounts = [
  { email: "waiter@kitchen.local", role: "Waiter" },
  { email: "kitchen@kitchen.local", role: "Kitchen" },
  { email: "manager@kitchen.local", role: "Manager" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("waiter@kitchen.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-light via-background to-stone-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-xl shadow-orange-300/50">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Kitchen Mate</h1>
          <p className="mt-2 text-muted">Sign in to manage orders and kitchen flow</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <Button type="submit" disabled={loading} fullWidth size="lg">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>

        <Card className="!p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Demo accounts</p>
          <p className="mb-3 text-xs text-muted">Password for all: <span className="font-mono font-semibold text-stone-700">Password123!</span></p>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setEmail(account.email)}
                className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-brand-light hover:text-brand"
              >
                {account.role}
              </button>
            ))}
          </div>
        </Card>

        <p className="text-center text-sm text-muted">
          New restaurant?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            Create your workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
