/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import config from "@payload-config"
import "@payloadcms/next/css"
import type { Metadata } from "next"
import type { ServerFunctionClient } from "payload"
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts"
import React from "react"
import { importMap } from "./admin/importMap.js"
import "./custom.scss"

type Args = {
  children: React.ReactNode
}

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

const serverFunction: ServerFunctionClient = async function (args) {
  "use server"
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: Args) {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  )
}
