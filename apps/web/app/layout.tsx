import { Geist_Mono, Geist, Audiowide } from "next/font/google"
import type { Metadata } from "next"
import NextTopLoader from "nextjs-toploader"
import Script from "next/script"

import "@workspace/ui/globals.css"
import "./globals.css"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { AppProviders } from "./providers"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { getSiteSettings } from "@/lib/cms"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontBrand = Audiowide({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: "400",
})

export const metadata: Metadata = {
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    title: "TrueRDP",
    capable: true,
    statusBarStyle: "default",
  },
}

function TawkToWidget() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID

  if (!propertyId || !widgetId) {
    return null
  }

  return (
    <Script
      id="tawk-to-widget"
      strategy="afterInteractive"
      src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
    />
  )
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isDevelopment = process.env.NODE_ENV === "development"
  const siteSettings = await getSiteSettings()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        fontBrand.variable
      )}
    >
      <body suppressHydrationWarning className="min-h-svh">
        <ThemeProvider>
          <TooltipProvider>
            <AppProviders>
              <div className="flex min-h-svh flex-col">
                <NextTopLoader
                  color="var(--primary)"
                  height={3}
                  showSpinner={false}
                />
                <SiteHeader
                  brandName={siteSettings.brandName}
                  headerLinks={siteSettings.headerLinks}
                />
                <div className="flex flex-1 flex-col">{children}</div>
                <SiteFooter
                  brandName={siteSettings.brandName}
                  footer={siteSettings.footer}
                  footerLinks={siteSettings.footerLinks}
                />
              </div>
              {!isDevelopment && <TawkToWidget />}
              <Toaster richColors position="top-center" duration={5000} />
            </AppProviders>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
