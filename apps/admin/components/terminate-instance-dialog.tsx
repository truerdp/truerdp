"use client"

import { useState } from "react"
import { useTerminateInstance } from "@/hooks/use-terminate-instance"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

interface TerminateInstanceDialogProps {
  instanceId: number
}

export default function TerminateInstanceDialog({
  instanceId,
}: TerminateInstanceDialogProps) {
  const [open, setOpen] = useState(false)
  const terminateInstance = useTerminateInstance()

  const isPending =
    terminateInstance.isPending && terminateInstance.variables === instanceId

  const handleConfirm = async () => {
    try {
      await terminateInstance.mutateAsync(instanceId)
      setOpen(false)
    } catch {
      // Error state is handled by the mutation object.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            disabled={terminateInstance.isPending}
          />
        }
      >
        Terminate
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate instance?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to terminate this instance? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Terminating...
              </>
            ) : (
              "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
