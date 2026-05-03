import {
  DodoDiscountInput,
  DodoDiscountRecord,
  getDodoClient,
} from "./shared.js"

function toDodoDiscountPayload(input: DodoDiscountInput) {
  const code = input.code.trim().toUpperCase()

  if (!code) {
    throw new Error("Dodo discount code is required")
  }

  return {
    code,
    name: `TrueRDP ${code}`,
    type: input.type === "percent" ? "percentage" : "flat",
    amount: input.type === "percent" ? input.value * 100 : input.value,
    expires_at:
      input.isActive === false
        ? new Date(0).toISOString()
        : (input.expiresAt?.toISOString() ?? null),
    usage_limit: input.maxUses ?? null,
  }
}

async function findDodoDiscountByCode(code: string) {
  const client = getDodoClient()
  const normalizedCode = code.trim().toUpperCase()
  const result = client.discounts.list({
    code: normalizedCode,
    page_size: 100,
  })

  if (
    result &&
    typeof result === "object" &&
    Symbol.asyncIterator in result
  ) {
    for await (const discount of result as AsyncIterable<DodoDiscountRecord>) {
      if (discount.code?.trim().toUpperCase() === normalizedCode) {
        return discount
      }
    }

    return null
  }

  const items = (await result) as { items?: DodoDiscountRecord[] }

  return (
    items.items?.find(
      (discount) => discount.code?.trim().toUpperCase() === normalizedCode
    ) ?? null
  )
}

export async function ensureDodoDiscount(input: DodoDiscountInput) {
  const client = getDodoClient()
  const payload = toDodoDiscountPayload(input)
  const existing = input.existingDodoDiscountId
    ? ({ discount_id: input.existingDodoDiscountId } satisfies DodoDiscountRecord)
    : await findDodoDiscountByCode(payload.code)

  if (!existing?.discount_id) {
    const created = (await client.discounts.create(payload)) as DodoDiscountRecord

    if (!created.discount_id) {
      throw new Error(`Dodo discount create response missing discount_id`)
    }

    return created.discount_id
  }

  await client.discounts.update(existing.discount_id, payload)
  return existing.discount_id
}

export async function syncDodoDiscountForCoupon(input: DodoDiscountInput) {
  const dodoDiscountId = await ensureDodoDiscount(input)

  return {
    dodoDiscountId,
    syncedAt: new Date(),
  }
}

