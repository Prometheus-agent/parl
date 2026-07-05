import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parl — Parimutuel Prediction Markets Protocol",
  description:
    "Infrastructure for infinite-scale, market-maker-free prediction markets. Built on Avalanche Fuji.",
  openGraph: {
    title: "Parl — Prediction Markets Protocol",
    description: "Infrastructure for infinite-scale, market-maker-free prediction markets.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body selection:bg-neutral-500/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
