export const queryKeys = {
  expiringSoonInstances: () => ["instances", "expiring-soon"] as const,
  expiredInstances: () => ["instances", "expired"] as const,
  profile: () => ["profile"] as const,
} as const
