import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  SITE_ASSET_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ASSET_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} - Agent-Friendly Tool Directory`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/json": "/api/agent/catalog",
      "application/openapi+json": "/openapi.json",
      "text/markdown": "/skill.md",
      "text/plain": "/llms.txt",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_ASSET_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} agent-friendly tool directory`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_ASSET_URL}/twitter-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full LLM context" />
        <link rel="alternate" type="text/markdown" href="/skill.md" title="Agent skill" />
        <link rel="alternate" type="application/json" href="/api/agent/catalog" title="Agent catalog JSON" />
        <link rel="alternate" type="application/openapi+json" href="/openapi.json" title="OpenAPI schema" />
        <link rel="mcp-server" href="/api/mcp" />
        <meta name="agent-interface" content="/agents" />
        <meta name="agent-search-api" content="/api/agent/search?q=stripe&page=1&limit=10" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
