"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Invoice03Icon } from "@hugeicons/core-free-icons"

import { useCart } from "@/components/cart/cart-provider"
import { webPaths } from "@/lib/paths"
import { Button } from "@workspace/ui/components/button"

export function CartButton() {
  const cart = useCart()

  return (
    <Link href={webPaths.cart}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative min-w-9 px-3"
        aria-label={`Open cart with ${cart.itemCount} item${
          cart.itemCount === 1 ? "" : "s"
        }`}
      >
        <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
        <span className="hidden sm:inline">Cart</span>
        {cart.itemCount > 0 ? (
          <span className="absolute -top-2 -right-2 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
            {cart.itemCount > 99 ? "99+" : cart.itemCount}
          </span>
        ) : null}
      </Button>
    </Link>
  )
}
