import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGuard } from "@/components/AuthGuard";
import { Nav } from "@/components/Nav";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kitchen Mate",
  description: "Restaurant order and kitchen management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 antialiased dark:bg-zinc-950`}>
        <AuthProvider>
          <AuthGuard>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
