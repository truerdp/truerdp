"use client"

import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingBag01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

import { useCart } from "@/components/cart/cart-provider"
import { webPaths } from "@/lib/paths"
import { formatAmount } from "@/lib/format"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

export function CartSheet() {
  const cart = useCart()
  const router = useRouter()

  const handleGoToCart = () => {
    cart.setSheetOpen(false)
    router.push(webPaths.cart)
  }

  return (
    <Sheet open={cart.isSheetOpen} onOpenChange={cart.setSheetOpen}>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-md bg-background border-l shadow-2xl overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={ShoppingBag01Icon}
              className="size-5 text-primary"
              strokeWidth={2}
            />
            <SheetTitle className="text-lg font-bold tracking-tight">Your Cart</SheetTitle>
            {cart.itemCount > 0 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs font-semibold">
                {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5">
          {cart.isLoading ? (
            <div className="flex h-full flex-col items-center justify-center p-8">
              <Spinner className="size-8 animate-spin" />
              <p className="mt-3 text-sm text-muted-foreground">Loading cart items...</p>
            </div>
          ) : cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted/40 p-4 mb-4">
                <HugeiconsIcon icon={ShoppingBag01Icon} className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                Explore our premium RDP plans and add them to get started.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => cart.setSheetOpen(false)}
              >
                Browse Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-sm hover:border-primary/20 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                        {item.planName}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.planType} • {item.planLocation}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-muted/75 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                          {item.cpu} vCPU
                        </span>
                        <span className="text-[10px] bg-muted/75 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                          {item.ram} GB RAM
                        </span>
                        <span className="text-[10px] bg-muted/75 text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                          {item.storage} GB SSD
                        </span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                          {item.durationDays} days
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-foreground text-sm block">
                        {formatAmount(item.lineTotalUsdCents)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {formatAmount(item.priceUsdCents)} each
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-7 rounded-md"
                        disabled={cart.isMutating}
                        onClick={() =>
                          item.quantity > 1
                            ? void cart.setItemQuantity(item.id, item.quantity - 1)
                            : void cart.removeItem(item.id)
                        }
                      >
                        <HugeiconsIcon icon={MinusSignIcon} size={12} strokeWidth={2.5} />
                      </Button>
                      <span className="inline-flex size-7 items-center justify-center rounded-md border bg-background text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-7 rounded-md"
                        disabled={cart.isMutating}
                        onClick={() => void cart.setItemQuantity(item.id, item.quantity + 1)}
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={12} strokeWidth={2.5} />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                      disabled={cart.isMutating}
                      onClick={() => void cart.removeItem(item.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & CTAs */}
        {cart.items.length > 0 && (
          <div className="border-t bg-muted/10 p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="text-lg font-bold text-foreground">
                {formatAmount(cart.subtotalUsdCents)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                className="w-full h-10 text-sm font-medium gap-2 group/btn relative overflow-hidden"
                disabled={cart.isMutating}
                onClick={handleGoToCart}
              >
                {cart.isMutating ? <Spinner className="size-4 mr-2" /> : null}
                Go to Cart
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  strokeWidth={2}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-sm font-medium"
                disabled={cart.isMutating}
                onClick={() => cart.setSheetOpen(false)}
              >
                Add more Items
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
