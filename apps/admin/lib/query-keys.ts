export const queryKeys = {
  allInstances: () => ["instances"] as const,
  instanceDetails: (id: number) => ["instances", id] as const,
  plans: () => ["plans"] as const,
  invoices: () => ["invoices"] as const,
  transactions: () => ["transactions"] as const,
  servers: () => ["servers"] as const,
  expiringSoonInstances: () => ["instances", "expiring-soon"] as const,
  expiredInstances: () => ["instances", "expired"] as const,
  pendingTransactions: () => ["transactions", "pending"] as const,
  profile: () => ["profile"] as const,
} as const
