import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShellRuntime } from "@/components/app-shell-runtime";
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
  title: "IEC Projects Hub",
  description: "Project portfolio workspace",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <Suspense fallback={<main className="main-content" aria-busy="true" />}>
          <AppShellRuntime>{children}</AppShellRuntime>
        </Suspense>
      </body>
    </html>
  );
}
