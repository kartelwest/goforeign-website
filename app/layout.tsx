import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://goforeign.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Go Foreign | Live Bigger. Live Abroad.",
    template: "%s | Go Foreign",
  },
  description:
    "Lifestyle consulting, relocation guidance, and marketing support for people ready to move abroad and build their life in Brazil.",
  icons: {
    icon: "/go-foreign-logo.png",
  },
  openGraph: {
    title: "Go Foreign | Live Bigger. Live Abroad.",
    description:
      "Lifestyle consulting, relocation guidance, and marketing support for people ready to move abroad and build their life in Brazil.",
    url: siteUrl,
    siteName: "Go Foreign",
    images: ["/hero-bg.jpeg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Go Foreign | Live Bigger. Live Abroad.",
    description:
      "Lifestyle consulting, relocation guidance, and marketing support for people ready to move abroad and build their life in Brazil.",
    images: ["/hero-bg.jpeg"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
