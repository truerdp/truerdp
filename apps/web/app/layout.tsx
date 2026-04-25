import { Geist_Mono, Geist } from "next/font/google"
import { draftMode } from "next/headers"
import { VisualEditing } from "next-sanity/visual-editing"

import "@workspace/ui/globals.css"
import "./globals.css"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { AppProviders } from "./providers"
import SiteHeader from "@/components/site-header"
import { SanityLive } from "@/lib/sanity"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { isEnabled } = await draftMode()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>
            <AppProviders>
              <SiteHeader />
              {children}
              {isEnabled ? <SanityLive /> : null}
              {isEnabled ? <VisualEditing /> : null}
              <Toaster richColors position="top-center" duration={5000} />
            </AppProviders>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
