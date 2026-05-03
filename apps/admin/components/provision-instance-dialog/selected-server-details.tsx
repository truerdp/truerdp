import type { Server } from "@/hooks/use-available-servers"
import { Field, FieldLabel } from "@workspace/ui/components/field"

type SelectedServerDetailsProps = {
  server: Server
}

export function SelectedServerDetails({ server }: SelectedServerDetailsProps) {
  return (
    <Field className="rounded-lg bg-secondary/50 p-3">
      <FieldLabel className="text-sm font-medium">
        Selected Server Details
      </FieldLabel>
      <div className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Provider:</span>
          <span className="font-medium">{server.provider}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IP Address:</span>
          <span className="font-mono font-medium">{server.ipAddress}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CPU:</span>
          <span className="font-medium">{server.cpu} vCPU</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">RAM:</span>
          <span className="font-medium">{server.ram} GB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Storage:</span>
          <span className="font-medium">{server.storage} GB</span>
        </div>
      </div>
    </Field>
  )
}

