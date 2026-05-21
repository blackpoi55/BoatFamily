import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { SWRegister } from "@/components/sw-register";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ครอบครัว · Family",
  description: "พื้นที่ของครอบครัวเรา",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ครอบครัว" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, messages, cookieStore] = await Promise.all([
    getLocale(),
    getMessages(),
    cookies(),
  ]);
  const themeCookie = cookieStore.get("theme")?.value as
    | "light"
    | "dark"
    | "system"
    | undefined;
  const initialDark = themeCookie === "dark";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} h-full antialiased ${initialDark ? "dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <ThemeProvider initialTheme={themeCookie ?? "system"}>
          <NextIntlClientProvider messages={messages}>
            {children}
            <SWRegister />
            <Toaster position="top-center" richColors theme="system" />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
