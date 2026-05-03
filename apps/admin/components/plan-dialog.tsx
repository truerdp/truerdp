"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { PlanForm, type PlanFormValues } from "@/components/plan-form"

interface PlanDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  defaultValues?: PlanFormValues
  onSubmit: (values: PlanFormValues) => Promise<void>
}

export function PlanDialog({
  mode,
  open,
  onOpenChange,
  isPending,
  defaultValues,
  onSubmit,
}: PlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-5 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{mode === "edit" ? "Edit Plan" : "Create Plan"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update compute resources and pricing options."
              : "Add a new plan with one or more pricing durations."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <PlanForm
            mode={mode}
            onSubmit={onSubmit}
            isPending={isPending}
            defaultValues={defaultValues}
            showBackButton={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
