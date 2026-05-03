import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ComputerTerminalIcon } from "@hugeicons/core-free-icons"
import { adminPaths } from "@/lib/paths"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { TabsContent } from "@workspace/ui/components/tabs"
import {
  CompactField,
  SectionEmpty,
  formatDateOnly,
  formatStatusLabel,
  getInstanceExpiryLabel,
  getInstanceExtensionsLabel,
  getInstancePlanLabel,
  getInstanceServerLabel,
  getInstanceStatusVariant,
} from "./helpers"
import type { UserDetailsData } from "./types"
export function InfrastructureTab({ data }: { data: UserDetailsData }) {
  return (
    <TabsContent value="infrastructure" className="space-y-4">
      {data.summary.expiringSoonInstances > 0 ? (
        <Alert>
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
          <AlertTitle>Infrastructure follow-up needed</AlertTitle>
          <AlertDescription>
            {data.summary.expiringSoonInstances} instance
            {data.summary.expiringSoonInstances === 1 ? "" : "s"} expire within
            the next 72 hours.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Instance Portfolio</CardTitle>
          <CardDescription>
            Provisioning history, lifecycle state, and extension signal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.instances.length === 0 ? (
            <SectionEmpty
              title="No infrastructure history yet"
              description="Confirmed purchases will create instance records here."
              icon={ComputerTerminalIcon}
            />
          ) : (
            <div className="space-y-3">
              <div className="space-y-3 md:hidden">
                {data.instances.map((instance) => (
                  <div
                    key={instance.id}
                    className="rounded-3xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Link
                          href={adminPaths.instanceDetails(instance.id)}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          Instance #{instance.id}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          Order #{instance.originOrderId}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getInstanceStatusVariant(instance.status)}>
                          {formatStatusLabel(instance.status)}
                        </Badge>
                        {instance.isExpiringSoon ? (
                          <Badge variant="secondary">Expiring soon</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <CompactField
                        label="Plan"
                        value={getInstancePlanLabel(instance)}
                      />
                      <CompactField
                        label="Server"
                        value={getInstanceServerLabel(instance)}
                      />
                      <CompactField
                        label="Expiry"
                        value={`${formatDateOnly(instance.expiryDate)} • ${getInstanceExpiryLabel(
                          instance
                        )}`}
                      />
                      <CompactField
                        label="Extensions"
                        value={getInstanceExtensionsLabel(instance)}
                        className="text-muted-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Server</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Extensions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.instances.map((instance) => (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Link
                              href={adminPaths.instanceDetails(instance.id)}
                              className="font-medium transition-colors hover:text-primary"
                            >
                              Instance #{instance.id}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              Order #{instance.originOrderId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getInstanceStatusVariant(instance.status)}>
                              {formatStatusLabel(instance.status)}
                            </Badge>
                            {instance.isExpiringSoon ? (
                              <Badge variant="secondary">Expiring soon</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              {instance.plan?.name || "Plan unavailable"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {instance.plan
                                ? `${instance.plan.cpu} CPU • ${instance.plan.ram} GB RAM • ${instance.plan.storage} GB`
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {instance.server?.ipAddress || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {instance.server?.provider || "Unassigned"}
                              {instance.resource?.username
                                ? ` • ${instance.resource.username}`
                                : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {formatDateOnly(instance.expiryDate)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getInstanceExpiryLabel(instance)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getInstanceExtensionsLabel(instance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
