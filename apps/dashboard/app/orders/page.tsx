"use client"

import { useOrders } from "@/hooks/use-orders"
import { OrdersEmpty, OrdersSkeleton } from "@/components/orders-page/states"
import { OrdersTable } from "@/components/orders-page/table"

function OrdersHeader() {
  return (
    <>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-muted-foreground">
        Your checkout and renewal orders are listed below.
      </p>
    </>
  )
}

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="rounded-lg border">
          <OrdersSkeleton />
        </div>
      </div>
    )
  }

  if (isError) {
    return <div className="text-sm text-destructive">Failed to load orders.</div>
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <OrdersHeader />
        </div>
        <div className="rounded-lg border">
          <OrdersEmpty />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <OrdersHeader />
      <div className="rounded-lg border">
        <OrdersTable orders={orders} />
      </div>
    </div>
  )
}
