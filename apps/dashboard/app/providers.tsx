"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useState } from "react"

const ReactQueryDevtools =
  process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === "true"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (mod) => mod.ReactQueryDevtools
          ),
        { ssr: false }
      )
    : null

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  )
}
