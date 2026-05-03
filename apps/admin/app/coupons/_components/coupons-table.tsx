import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { formatCouponValue, type Coupon } from "@/app/coupons/models"

type CouponsTableProps = {
  isLoading: boolean
  coupons: Coupon[]
  onEdit: (coupon: Coupon) => void
  onToggle: (coupon: Coupon) => void
}

export function CouponsTable({
  isLoading,
  coupons,
  onEdit,
  onToggle,
}: CouponsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Applies to</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dodo</TableHead>
            <TableHead className="w-32">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7}>Loading coupons...</TableCell>
            </TableRow>
          ) : coupons.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>No coupons created yet.</TableCell>
            </TableRow>
          ) : (
            coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono">{coupon.code}</TableCell>
                <TableCell>{formatCouponValue(coupon)}</TableCell>
                <TableCell>{coupon.appliesTo.replaceAll("_", " ")}</TableCell>
                <TableCell>
                  {coupon.usageCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? "default" : "outline"}>
                    {coupon.isActive ? "active" : "inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={
                        coupon.dodoSyncStatus === "synced"
                          ? "secondary"
                          : coupon.dodoSyncStatus === "failed"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {coupon.dodoSyncStatus}
                    </Badge>
                    {coupon.dodoSyncError ? (
                      <span className="max-w-52 truncate text-xs text-muted-foreground">
                        {coupon.dodoSyncError}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(coupon)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggle(coupon)}
                    >
                      {coupon.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
