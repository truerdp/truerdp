import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4">
        <h2 className="mb-4 text-xl font-semibold">TrueRDP</h2>
        <nav className="space-y-2">
          <a href="/dashboard" className="block">
            Instances
          </a>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
