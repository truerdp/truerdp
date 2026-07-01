"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"
import { queryKeys } from "@/lib/query-keys"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"

type PaymentSettingsForm = {
  upiEnabled: boolean
  usdtTrc20Enabled: boolean
  dodoCheckoutEnabled: boolean
  coingateCheckoutEnabled: boolean
  paypalCheckoutEnabled: boolean
  usdtTrc20WalletAddress: string
  usdtTrc20QrCodeImageUrl: string
}

const emptyForm: PaymentSettingsForm = {
  upiEnabled: false,
  usdtTrc20Enabled: false,
  dodoCheckoutEnabled: false,
  coingateCheckoutEnabled: false,
  paypalCheckoutEnabled: false,
  usdtTrc20WalletAddress: "",
  usdtTrc20QrCodeImageUrl: "",
}

function toFormState(input?: Partial<PaymentSettingsForm> | null) {
  return {
    upiEnabled: input?.upiEnabled ?? false,
    usdtTrc20Enabled: input?.usdtTrc20Enabled ?? false,
    dodoCheckoutEnabled: input?.dodoCheckoutEnabled ?? false,
    coingateCheckoutEnabled: input?.coingateCheckoutEnabled ?? false,
    paypalCheckoutEnabled: input?.paypalCheckoutEnabled ?? false,
    usdtTrc20WalletAddress: input?.usdtTrc20WalletAddress ?? "",
    usdtTrc20QrCodeImageUrl: input?.usdtTrc20QrCodeImageUrl ?? "",
  } satisfies PaymentSettingsForm
}

export default function PaymentSettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PaymentSettingsForm>(emptyForm)

  const { data, isLoading, isError, error } = useQuery<PaymentSettingsForm>({
    queryKey: queryKeys.paymentSettings(),
    queryFn: () => clientApi("/admin/payment-settings"),
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setForm(toFormState(data))
  }, [data])

  const saveSettings = useMutation({
    mutationFn: (input: PaymentSettingsForm) =>
      clientApi("/admin/payment-settings", {
        method: "PUT",
        body: {
          ...input,
          usdtTrc20WalletAddress: input.usdtTrc20WalletAddress.trim(),
          usdtTrc20QrCodeImageUrl: input.usdtTrc20QrCodeImageUrl.trim(),
        },
      }),
    onSuccess: async () => {
      toast.success("Payment settings updated")
      await queryClient.invalidateQueries({
        queryKey: queryKeys.paymentSettings(),
      })
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Unable to update payment settings")
    },
  })

  const enabledCount = [
    form.upiEnabled,
    form.usdtTrc20Enabled,
    form.dodoCheckoutEnabled,
    form.coingateCheckoutEnabled,
    form.paypalCheckoutEnabled,
  ].filter(Boolean).length

  const trc20Configured =
    !form.usdtTrc20Enabled ||
    (form.usdtTrc20WalletAddress.trim().length > 0 &&
      form.usdtTrc20QrCodeImageUrl.trim().length > 0)

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control which checkout methods appear on the public web app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Method visibility</CardTitle>
          <CardDescription>
            Enabled methods are shown to customers during checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <MethodToggle
            title="UPI"
            description="Manual UPI payment option"
            checked={form.upiEnabled}
            onCheckedChange={(checked) => {
              setForm((current) => ({ ...current, upiEnabled: checked }))
            }}
          />
          <MethodToggle
            title="USDT TRC20"
            description="Manual crypto payment with customer-submitted TxID"
            checked={form.usdtTrc20Enabled}
            onCheckedChange={(checked) => {
              setForm((current) => ({ ...current, usdtTrc20Enabled: checked }))
            }}
          />
          <MethodToggle
            title="Dodo Checkout"
            description="Hosted card and wallet checkout"
            checked={form.dodoCheckoutEnabled}
            onCheckedChange={(checked) => {
              setForm((current) => ({
                ...current,
                dodoCheckoutEnabled: checked,
              }))
            }}
          />
          <MethodToggle
            title="CoinGate Checkout"
            description="Hosted crypto checkout"
            checked={form.coingateCheckoutEnabled}
            onCheckedChange={(checked) => {
              setForm((current) => ({
                ...current,
                coingateCheckoutEnabled: checked,
              }))
            }}
          />
          <MethodToggle
            title="PayPal Checkout"
            description="Hosted PayPal checkout"
            checked={form.paypalCheckoutEnabled}
            onCheckedChange={(checked) => {
              setForm((current) => ({
                ...current,
                paypalCheckoutEnabled: checked,
              }))
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TRC20 details</CardTitle>
          <CardDescription>
            These values are shown when USDT TRC20 is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field>
            <FieldLabel>Wallet address / hash</FieldLabel>
            <Input
              value={form.usdtTrc20WalletAddress}
              onChange={(event) => {
                const value = event.target.value
                setForm((current) => ({
                  ...current,
                  usdtTrc20WalletAddress: value,
                }))
              }}
              placeholder="TUE67fuWyc4XLMeDFpywCgZuoNcdmSAfE2"
            />
            <FieldDescription>
              This is the TRC20 wallet string customers copy during checkout.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>QR code image URL</FieldLabel>
            <Input
              value={form.usdtTrc20QrCodeImageUrl}
              onChange={(event) => {
                const value = event.target.value
                setForm((current) => ({
                  ...current,
                  usdtTrc20QrCodeImageUrl: value,
                }))
              }}
              placeholder="/payment/usdt-qr.png"
            />
            <FieldDescription>
              Accepts a local asset path, CDN URL, or data URL.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {enabledCount} payment method{enabledCount === 1 ? "" : "s"} enabled
          </p>
          <p className="text-sm text-muted-foreground">
            {form.usdtTrc20Enabled && !trc20Configured
              ? "USDT TRC20 needs both wallet address and QR code image before it can be saved."
              : "Changes take effect in the web checkout after the API responds successfully."}
          </p>
        </div>
        <Button
          onClick={() => saveSettings.mutate(form)}
          disabled={isLoading || saveSettings.isPending || !trc20Configured}
        >
          {saveSettings.isPending ? "Saving..." : "Save settings"}
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          Loading payment settings...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border px-4 py-3 text-sm text-destructive">
          {error.message || "Failed to load payment settings."}
        </div>
      ) : null}
    </section>
  )
}

function MethodToggle({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
  )
}
