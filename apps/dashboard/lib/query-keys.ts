export const queryKeys = {
  instances: () => ["instances"] as const,
  instance: (id: string | number) => ["instance", String(id)] as const,
  transactions: () => ["transactions"] as const,
  instanceTransactions: (id: string | number) =>
    ["instance-transactions", String(id)] as const,
}
