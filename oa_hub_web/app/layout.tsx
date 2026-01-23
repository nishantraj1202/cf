import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codinzhub.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Codinzhub - Premium OA & Interview Prep Hub",
    template: "%s | Codinzhub",
  },
  description: "The ultimate platform for tracking and practicing Online Assessments (OA) and coding interview questions from top tech companies like Google, Meta, Amazon, and more.",
  keywords: [
    "coding interview",
    "online assessment",
    "OA questions",
    "technical interview prep",
    "LeetCode",
    "programming practice",
    "Google interview",
    "Meta interview",
    "Amazon interview",
    "software engineer interview",
    "DSA practice",
    "algorithms",
    "data structures",
  ],
  authors: [{ name: "Codinzhub Team" }],
  creator: "Codinzhub",
  publisher: "Codinzhub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Codinzhub",
    title: "Codinzhub - Premium OA & Interview Prep Hub",
    description: "Master coding interviews with real OA questions from top tech companies.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Codinzhub - Ace Your Coding Interviews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Codinzhub - Premium OA & Interview Prep Hub",
    description: "Master coding interviews with real OA questions from top tech companies.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@Codinzhub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
