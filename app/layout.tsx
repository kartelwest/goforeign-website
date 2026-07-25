import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "./components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goforeign.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Go Foreign | Lifestyle Consulting & Relocation to Brazil",
    template: "%s | Go Foreign",
  },
  description:
    "Go Foreign is a lifestyle management consulting firm helping you relocate, build your brand, and live abroad in Brazil with confidence.",
  openGraph: {
    siteName: "Go Foreign",
    type: "website",
    images: ["/go-foreign-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/go-foreign-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Go Foreign",
  description:
    "Lifestyle management consulting firm helping clients relocate, build their brand, and live abroad in Brazil.",
  url: siteUrl,
  image: `${siteUrl}/go-foreign-logo.png`,
  areaServed: "Brazil",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
