import { Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import "./globals.css"
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
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <AppProviders>
              <AdminShell>{children}</AdminShell>
            </AppProviders>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
