import Link from "next/link"

import { dashboardPaths } from "@/lib/paths"
import { formatTicketDate, type TicketSummary } from "@/components/support-page/types"
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

type TicketsTableProps = {
  filteredTickets: TicketSummary[]
  isLoading: boolean
}

export function TicketsTable({ filteredTickets, isLoading }: TicketsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last activity</TableHead>
            <TableHead className="w-28">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>Loading tickets...</TableCell>
            </TableRow>
          ) : filteredTickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>No tickets found.</TableCell>
            </TableRow>
          ) : (
            filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono">#{ticket.id}</TableCell>
                <TableCell className="min-w-56 font-medium">
                  {ticket.subject}
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
                    href={dashboardPaths.supportTicket(ticket.id)}
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
