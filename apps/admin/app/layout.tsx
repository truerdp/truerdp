import { Geist, Geist_Mono } from "next/font/google"

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
        geist.variable
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
