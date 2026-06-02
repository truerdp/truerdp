import { Geist, Geist_Mono, Audiowide } from "next/font/google"
import type { Metadata } from "next"
import "quill/dist/quill.snow.css"

import "@workspace/ui/globals.css"
import "./globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import AdminShell from "@/components/admin-shell"
import { cn } from "@workspace/ui/lib/utils"
import { AppProviders } from "./providers"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>
            <AppProviders>
              <AdminShell>{children}</AdminShell>
              <Toaster richColors position="top-center" duration={5000} />
            </AppProviders>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
