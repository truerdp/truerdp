export const queryKeys = {
  allInstances: () => ["instances"] as const,
  instanceDetails: (id: number) => ["instances", id] as const,
  users: () => ["users"] as const,
  userDetails: (id: number) => ["users", id] as const,
  plans: () => ["plans"] as const,
  auditLogs: (params: Record<string, string | number | undefined>) =>
    ["audit-logs", params] as const,
  webhookEvents: (params: Record<string, string | number | undefined>) =>
    ["webhook-events", params] as const,
  coupons: () => ["coupons"] as const,
  supportTickets: () => ["support", "tickets"] as const,
  supportTicket: (id: number) => ["support", "tickets", id] as const,
  orders: () => ["orders"] as const,
  order: (id: string | number) => ["orders", String(id)] as const,
  invoices: () => ["invoices"] as const,
  invoice: (id: string | number) => ["invoices", String(id)] as const,
  transactions: () => ["transactions"] as const,
  transaction: (id: string | number) =>
    ["transactions", String(id)] as const,
  servers: () => ["servers"] as const,
  expiringSoonInstances: () => ["instances", "expiring-soon"] as const,
  expiredInstances: () => ["instances", "expired"] as const,
  pendingTransactions: () => ["transactions", "pending"] as const,
  profile: () => ["profile"] as const,
} as const
