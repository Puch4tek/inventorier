import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { InstallPrompt } from "@/components/install-prompt";
import "./globals.css";

export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const s = localStorage.getItem("inventory-theme"); const dark = s === "dark" || (s !== "light" && matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.classList.toggle("dark", dark); })();`,
          }}
        />
        <NextIntlClientProvider>
          {children}
          <InstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
