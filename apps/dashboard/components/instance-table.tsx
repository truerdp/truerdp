"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default function InstanceTable({ instances }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {instances.map((i: any) => (
          <TableRow key={i.id}>
            <TableCell>{i.id}</TableCell>
            <TableCell>{i.status}</TableCell>
            <TableCell>{i.ipAddress || "-"}</TableCell>
            <TableCell>
              {i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : "-"}
            </TableCell>
            <TableCell>
              <Link href={`/dashboard/instances/${i.id}`}>View</Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
