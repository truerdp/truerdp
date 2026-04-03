import Link from "next/link"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4">
        <h2 className="mb-4 text-xl font-semibold">TrueRDP</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block">
            Instances
          </Link>
          <Link href="/dashboard/transactions" className="block">
            Transactions
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
