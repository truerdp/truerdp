import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { adminPaths } from "@/lib/paths"
import { formatTicketDate, type TicketSummary } from "@/app/support/models"

type TicketsTableProps = {
  isLoading: boolean
  tickets: TicketSummary[]
}

export function TicketsTable({ isLoading, tickets }: TicketsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last activity</TableHead>
            <TableHead className="w-28">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6}>Loading tickets...</TableCell>
            </TableRow>
          ) : tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No tickets found.</TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono">#{ticket.id}</TableCell>
                <TableCell className="min-w-56 font-medium">
                  {ticket.subject}
                </TableCell>
                <TableCell className="min-w-52">
                  <div>{ticket.user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    User #{ticket.userId}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ticket.status === "open" ? "default" : "outline"}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatTicketDate(ticket.lastMessageAt ?? ticket.createdAt)}
                </TableCell>
                <TableCell>
                  <Link
                    href={adminPaths.supportTicket(ticket.id)}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

