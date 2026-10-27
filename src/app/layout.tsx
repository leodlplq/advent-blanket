import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

// UI + body text: clean geometric sans, good for French accents.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Headings: warm, slightly festive serif.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advent Blanket",
  description: "Calendrier de l'Avent au crochet : le point et la pelotte du jour.",
};

// Mobile browser chrome tinted with the app red (matches src/app/icon.svg).
export const viewport: Viewport = {
  themeColor: "#b0413e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
      // Browser extensions / browser features can inject attributes (e.g. a
      // __gcrremoteframetoken) onto <html> before hydration. React then warns
      // about a mismatch on every page load. scope it to this element only.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
