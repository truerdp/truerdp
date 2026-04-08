export const queryKeys = {
  expiringSoonInstances: () => ["instances", "expiring-soon"] as const,
  expiredInstances: () => ["instances", "expired"] as const,
} as const
