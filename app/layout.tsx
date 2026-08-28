import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIRROR — Investment Strategy Education Platform",
  description:
    "See how experienced investors think, across every market, before you invest your own money.",
  keywords: [
    "investment education",
    "strategy transparency",
    "financial research",
    "investment learning",
  ],
  openGraph: {
    title: "MIRROR",
    description:
      "See how experienced investors think, before you invest your own money.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className="antialiased bg-neutral-50 text-neutral-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
