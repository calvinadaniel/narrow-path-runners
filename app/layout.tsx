import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Narrow Path Runners — EST. 2025",
  description:
    "Find your run with the pack. Race results, photos, and stories from Narrow Path Runners.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-brand-cream text-brand-ink antialiased overflow-x-hidden">
        <Nav />
        <div className="flex-1 min-w-0 w-full">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
