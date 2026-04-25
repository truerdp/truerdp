export const queryKeys = {
  profile: () => ["profile"] as const,
  instances: () => ["instances"] as const,
  instance: (id: string | number) => ["instance", String(id)] as const,
  transactions: () => ["transactions"] as const,
  invoices: () => ["invoices"] as const,
  supportTickets: () => ["support", "tickets"] as const,
  supportTicket: (id: string | number) =>
    ["support", "tickets", String(id)] as const,
  instanceTransactions: (id: string | number) =>
    ["instance", String(id), "transactions"] as const,
}
