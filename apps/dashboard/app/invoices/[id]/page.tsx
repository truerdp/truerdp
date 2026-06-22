"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, PrinterIcon } from "@hugeicons/core-free-icons"

import { useInvoices } from "@/hooks/use-invoices"
import { dashboardPaths } from "@/lib/paths"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { InvoiceDetailsCard } from "@/components/invoice-details/invoice-details-card"
import {
  InvoiceDetailsError,
  InvoiceDetailsSkeleton,
  InvoiceNotFound,
  MissingInvoiceReference,
} from "@/components/invoice-details/states"

export default function InvoiceDetailsPage() {
  const { id } = useParams()
  const invoiceId = Number(String(id ?? ""))
  const hasValidInvoiceId = Number.isInteger(invoiceId) && invoiceId > 0
  const { data, isLoading, isError } = useInvoices()

  const invoice = useMemo(() => {
    if (!data || !hasValidInvoiceId) {
      return null
    }

    return data.find((item) => item.id === invoiceId) ?? null
  }, [data, hasValidInvoiceId, invoiceId])

  if (!hasValidInvoiceId) {
    return <MissingInvoiceReference />
  }

  if (isLoading) {
    return <InvoiceDetailsSkeleton />
  }

  if (isError) {
    return <InvoiceDetailsError />
  }

  if (!invoice) {
    return <InvoiceNotFound />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-4 print:hidden">
        <Link
          href={dashboardPaths.invoices}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Back to invoices
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <HugeiconsIcon
            icon={PrinterIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Print Invoice
        </Button>
      </div>
      <InvoiceDetailsCard invoice={invoice} />
    </div>
  )
}
