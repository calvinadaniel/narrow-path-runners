import type { Metadata } from "next";
import "./globals.css";
import MapBackground from "@/components/MapBackground";
import { getNycBasemap } from "@/lib/marathon";

export const metadata: Metadata = {
  title: "Narrow Path Runners — EST. 2025",
  description:
    "Find your run with the pack. Race results, photos, and stories from Narrow Path Runners.",
  icons: {
    icon: [
      { url: "/icon.png?v=3", type: "image/png", sizes: "48x48" },
      { url: "/icon-512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icon.png?v=3",
    apple: [
      { url: "/apple-icon.png?v=3", type: "image/png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const basemap = getNycBasemap();
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-brand-cream text-brand-ink antialiased overflow-x-hidden">
        {basemap ? <MapBackground basemap={basemap} /> : null}
        <div className="relative z-10 flex-1 min-w-0 w-full">{children}</div>
      </body>
    </html>
  );
}
