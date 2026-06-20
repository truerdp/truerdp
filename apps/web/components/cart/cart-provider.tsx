"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"

import { useProfile } from "@/hooks/use-profile"

export interface CartItemInput {
  planPricingId: number
  planId?: number
  planName?: string
  planType?: string
  planLocation?: string
  cpu?: number
  ram?: number
  storage?: number
  durationDays?: number
  priceUsdCents?: number
  originalPriceUsdCents?: number
}

export interface CartItem {
  id: number
  planPricingId: number
  planId: number
  planName: string
  planType: string
  planLocation: string
  cpu: number
  ram: number
  storage: number
  durationDays: number
  priceUsdCents: number
  originalPriceUsdCents: number
  quantity: number
  lineTotalUsdCents: number
}

export interface CartResponse {
  items: CartItem[]
  itemCount: number
  subtotalUsdCents: number
}

interface CartContextValue extends CartResponse {
  isLoading: boolean
  isMutating: boolean
  addItem: (item: CartItemInput) => Promise<CartResponse>
  removeItem: (cartItemId: number) => Promise<CartResponse>
  setItemQuantity: (
    cartItemId: number,
    quantity: number
  ) => Promise<CartResponse>
  clearCart: () => Promise<CartResponse>
  checkoutCart: () => Promise<{ orderId: number }>
  refetchCart: () => void
}

const emptyCart: CartResponse = {
  items: [],
  itemCount: 0,
  subtotalUsdCents: 0,
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const profileQuery = useProfile()
  const isAuthenticated = !profileQuery.isError && Boolean(profileQuery.data)

  const cartQuery = useQuery<CartResponse>({
    queryKey: ["cart"],
    queryFn: () => clientApi("/cart"),
    enabled: isAuthenticated,
  })

  const refreshCart = useCallback(
    async (cart?: CartResponse) => {
      if (cart) {
        queryClient.setQueryData(["cart"], cart)
      }

      await queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
    [queryClient]
  )

  const addMutation = useMutation({
    mutationFn: (item: CartItemInput) =>
      clientApi("/cart/items", {
        method: "POST",
        body: {
          planPricingId: item.planPricingId,
          quantity: 1,
        },
      }) as Promise<CartResponse>,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      cartItemId,
      quantity,
    }: {
      cartItemId: number
      quantity: number
    }) =>
      clientApi(`/cart/items/${cartItemId}`, {
        method: "PATCH",
        body: { quantity },
      }) as Promise<CartResponse>,
  })

  const removeMutation = useMutation({
    mutationFn: (cartItemId: number) =>
      clientApi(`/cart/items/${cartItemId}`, {
        method: "DELETE",
      }) as Promise<CartResponse>,
  })

  const clearMutation = useMutation({
    mutationFn: () =>
      clientApi("/cart", {
        method: "DELETE",
      }) as Promise<CartResponse>,
  })

  const checkoutMutation = useMutation({
    mutationFn: () =>
      clientApi("/cart/checkout", {
        method: "POST",
      }) as Promise<{ orderId: number }>,
  })

  const value = useMemo<CartContextValue>(() => {
    const cart = cartQuery.data ?? emptyCart

    return {
      ...cart,
      isLoading: cartQuery.isLoading || profileQuery.isLoading,
      isMutating:
        addMutation.isPending ||
        updateMutation.isPending ||
        removeMutation.isPending ||
        clearMutation.isPending ||
        checkoutMutation.isPending,
      addItem: async (item) => {
        const nextCart = await addMutation.mutateAsync(item)
        await refreshCart(nextCart)
        return nextCart
      },
      removeItem: async (cartItemId) => {
        const nextCart = await removeMutation.mutateAsync(cartItemId)
        await refreshCart(nextCart)
        return nextCart
      },
      setItemQuantity: async (cartItemId, quantity) => {
        const nextCart = await updateMutation.mutateAsync({
          cartItemId,
          quantity,
        })
        await refreshCart(nextCart)
        return nextCart
      },
      clearCart: async () => {
        const nextCart = await clearMutation.mutateAsync()
        await refreshCart(nextCart)
        return nextCart
      },
      checkoutCart: async () => {
        const order = await checkoutMutation.mutateAsync()
        await refreshCart(emptyCart)
        return order
      },
      refetchCart: () => {
        void cartQuery.refetch()
      },
    }
  }, [
    addMutation,
    cartQuery,
    checkoutMutation,
    clearMutation,
    profileQuery.isLoading,
    refreshCart,
    removeMutation,
    updateMutation,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}
