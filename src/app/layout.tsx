import type { Metadata, Viewport } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGate } from "@/components/auth-gate"

export const metadata: Metadata = {
  title: "SwiftPOS - Modern Point of Sale System",
  description: "Complete POS solution for modern businesses. Fast, reliable, and easy to use.",
  keywords: "pos, point of sale, retail, inventory, sales management, business software",
  authors: [{ name: "SwiftPOS" }],
  creator: "SwiftPOS",
  publisher: "SwiftPOS",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http') ? process.env.NEXT_PUBLIC_APP_URL : `https://${process.env.NEXT_PUBLIC_APP_URL}`) : 'https://remix-of-remix-of-swiftpos.vercel.app'),
  openGraph: {
    title: "SwiftPOS - Modern Point of Sale System",
    description: "Complete POS solution for modern businesses",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftPOS - Modern Point of Sale System",
    description: "Complete POS solution for modern businesses",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to asset host for faster image loads */}
        <link rel="preconnect" href="https://slelguoygbfzlpylpxfs.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//slelguoygbfzlpylpxfs.supabase.co" />
      </head>
      <body className="min-h-screen antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="44f8d2d9-6a9c-4ca5-a17a-f663b1f36469"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorReporter />
          <Script
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
            strategy="afterInteractive"
            data-target-origin="*"
            data-message-type="ROUTE_CHANGE"
            data-include-search-params="true"
            data-only-in-iframe="true"
            data-debug="true"
            data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
          />
            <AuthGate>
              {children}
            </AuthGate>

          <Toaster position="top-right" richColors />
          <VisualEditsMessenger />
        </ThemeProvider>
      </body>
    </html>
  )
}
