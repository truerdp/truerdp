import { formatAmount } from "@/lib/format"
import { formatSafeDate } from "@/components/dashboard-home/overview"
import type { Transaction } from "@/hooks/use-transactions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type RecentTransactionsTableProps = {
  transactions: Transaction[]
}

export function RecentTransactionsTable({
  transactions,
}: RecentTransactionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-mono text-sm">#{transaction.id}</TableCell>
            <TableCell className="font-medium">
              {formatAmount(transaction.amount)}
            </TableCell>
            <TableCell className="capitalize">{transaction.status}</TableCell>
            <TableCell>{formatSafeDate(transaction.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
