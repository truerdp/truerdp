"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"

import { adminPaths } from "@/lib/paths"
import { queryKeys } from "@/lib/query-keys"
import { uploadSupportImage } from "@/lib/support-image-upload"
import { useUsers } from "@/hooks/use-users"
import { type TicketSummary } from "@/app/support/models"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { RichTextEditor } from "@workspace/ui/components/rich-text-editor"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

export function CreateTicketForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [userEmail, setUserEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const { data: users = [] } = useUsers()

  const userEmailOptions = useMemo(
    () => users.map((user) => user.email),
    [users]
  )

  const selectedUser = useMemo(
    () => users.find((user) => user.email === userEmail) ?? null,
    [userEmail, users]
  )

  const createTicket = useMutation({
    mutationFn: () =>
      clientApi<{ ticket: TicketSummary }>("/admin/support/tickets", {
        method: "POST",
        body: {
          userId: selectedUser?.id ?? 0,
          subject,
          message,
        },
      }),
    onSuccess: async () => {
      setUserEmail("")
      setSubject("")
      setMessage("")
      await queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets(),
      })
      toast.success("Ticket created")
      router.push(adminPaths.support)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to create ticket")
    },
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <Field>
          <FieldLabel>User email</FieldLabel>
          <Combobox
            items={userEmailOptions}
            value={userEmail || null}
            onValueChange={(value) => setUserEmail(value ?? "")}
            disabled={userEmailOptions.length === 0}
          >
            <ComboboxInput
              placeholder="Search user email"
              className="w-full"
              showTrigger={false}
              showClear
              disabled={userEmailOptions.length === 0}
            />
            <ComboboxContent>
              <ComboboxList>
                {(option) => (
                  <ComboboxItem key={option} value={option}>
                    {option}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>No users found</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </Field>
        <Field>
          <FieldLabel>Subject</FieldLabel>
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Billing, instance access, renewal..."
          />
        </Field>
        <Field>
          <FieldLabel>Message</FieldLabel>
          <RichTextEditor
            value={message}
            onChange={setMessage}
            placeholder="Initial support note."
            editorClassName="min-h-32"
            enableImages
            uploadImage={uploadSupportImage}
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => createTicket.mutate()}
          disabled={
            createTicket.isPending ||
            userEmail.trim().length === 0 ||
            subject.trim().length < 3 ||
            message.trim().length === 0
          }
        >
          Create ticket
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(adminPaths.support)}
          disabled={createTicket.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
