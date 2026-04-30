declare module "dodopayments" {
  export default class DodoPayments {
    constructor(config: {
      bearerToken: string
      environment?: "test_mode" | "live_mode"
      webhookKey?: string
    })
    checkoutSessions: {
      create(input: unknown): Promise<unknown>
    }
    discounts: {
      create(input: unknown): Promise<unknown>
      update(id: string, input?: unknown): Promise<unknown>
      list(input?: unknown): AsyncIterable<unknown> | Promise<unknown>
    }
    products: {
      create(input: unknown): Promise<{ product_id?: string }>
      update(id: string, input: unknown): Promise<void>
    }
    webhooks: {
      unwrap(
        rawBody: string,
        opts: { headers: Record<string, string | string[] | undefined> }
      ): unknown
    }
  }
}
