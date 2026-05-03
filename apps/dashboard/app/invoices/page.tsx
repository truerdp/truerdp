"use client"

import { useInvoices } from "@/hooks/use-invoices"
import { InvoicesTable } from "@/components/invoices-page/table"
import { InvoicesEmpty, InvoicesSkeleton } from "@/components/invoices-page/states"

function InvoicesHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
      <p className="text-sm text-muted-foreground">
        View your billing history and payment outcomes.
      </p>
    </div>
  )
}

export default function InvoicesPage() {
  const { data, isLoading, isError } = useInvoices()
  const invoices = data ?? []

  if (isLoading) {
    return (
      <section className="space-y-4">
        <InvoicesHeader />
        <div className="rounded-lg border">
          <InvoicesSkeleton />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">Failed to load invoices.</div>
    )
  }

  return (
    <section className="space-y-4">
      <InvoicesHeader />
      <div className="rounded-lg border">
        {invoices.length === 0 ? (
          <InvoicesEmpty />
        ) : (
          <InvoicesTable invoices={invoices} />
        )}
      </div>
    </section>
  )
}
