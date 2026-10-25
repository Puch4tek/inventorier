import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Inventory App",
  description: "System ewidencji i lokalizacji przedmiotów.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const s = localStorage.getItem("inventory-theme"); const d = s === "dark" || (s !== "light" && matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.dataset.theme = d ? "dark" : "light"; })();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
