export const queryKeys = {
  allInstances: () => ["instances"] as const,
  expiringSoonInstances: () => ["instances", "expiring-soon"] as const,
  expiredInstances: () => ["instances", "expired"] as const,
  pendingTransactions: () => ["transactions", "pending"] as const,
  profile: () => ["profile"] as const,
} as const
