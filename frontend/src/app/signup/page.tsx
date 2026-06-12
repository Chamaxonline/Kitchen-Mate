"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, ChefHat, Link2, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SignupPage() {
  const { register } = useAuth();
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [adminFullName, setAdminFullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleRestaurantNameChange(value: string) {
    setRestaurantName(value);
    if (!slugTouched) setSlug(slugFromName(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        restaurantName,
        slug,
        adminEmail,
        adminPassword,
        adminFullName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-light via-background to-stone-100 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-xl shadow-orange-300/50">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Start your restaurant</h1>
          <p className="mt-2 text-muted">Create your Kitchen Mate workspace in minutes</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Restaurant name</span>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => handleRestaurantNameChange(e.target.value)}
                  placeholder="Pizza Palace"
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Workspace URL</span>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="pizza-palace"
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 font-mono text-sm text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-muted">Lowercase letters, numbers, and hyphens only</p>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Your name</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-700">Admin email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
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
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-stone-50 py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted">At least 8 characters with upper, lower, and a number</p>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <Button type="submit" disabled={loading} fullWidth size="lg">
              {loading ? "Creating workspace..." : "Create restaurant"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
