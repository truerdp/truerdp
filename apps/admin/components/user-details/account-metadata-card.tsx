"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { toast } from "sonner"

import { clientApi } from "@workspace/api/client"
import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/base/date-picker"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { queryKeys } from "@/lib/query-keys"
import { formatDateOnly, formatDateTime } from "./helpers"
import type { UserDetailsData } from "./types"

type EditableRole = UserDetailsData["user"]["role"]

type AccountMetadataCardProps = {
  data: UserDetailsData
}

type AccountMetadataForm = {
  role: EditableRole
  dateOfBirth: string
  reason: string
}

export function AccountMetadataCard({ data }: AccountMetadataCardProps) {
  const [ticketId] = useQueryState("ticket", parseAsString)
  const ticketReference = getTicketReference(ticketId)
  const formKey = getAccountMetadataFormKey(data, ticketReference)

  return (
    <AccountMetadataCardContent
      key={formKey}
      data={data}
      ticketReference={ticketReference}
    />
  )
}

function AccountMetadataCardContent({
  data,
  ticketReference,
}: AccountMetadataCardProps & {
  ticketReference: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AccountMetadataForm>(() =>
    getInitialAccountMetadataForm(data, ticketReference)
  )
  const [error, setError] = useState<string | null>(null)

  const updateProfile = useMutation({
    mutationFn: () =>
      clientApi(`/admin/users/${data.user.id}/profile`, {
        method: "PATCH",
        body: {
          role: form.role,
          dateOfBirth: form.dateOfBirth.trim() || null,
          reason: form.reason.trim(),
        },
      }),
    onSuccess: async () => {
      toast.success("User profile updated")
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.userDetails(data.user.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users() }),
      ])
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update user profile"
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (form.reason.trim().length < 3) {
      setError("Add a reason or support ticket reference.")
      return
    }

    updateProfile.mutate()
  }

  const isSaving = updateProfile.isPending

  return (
    <Card id="account-metadata">
      <CardHeader>
        <CardTitle>Account Metadata</CardTitle>
        <CardDescription>
          Core identity and permission markers for the account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>User ID</FieldLabel>
              <Input value={`#${data.user.id}`} disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-user-role">Role</FieldLabel>
              <Select
                value={form.role}
                disabled={isSaving}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    role: value as EditableRole,
                  }))
                }
              >
                <SelectTrigger id="admin-user-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-user-date-of-birth">
                Date of birth
              </FieldLabel>
              <DatePicker
                id="admin-user-date-of-birth"
                value={form.dateOfBirth}
                disabled={isSaving}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-user-profile-reason">
                Reason / ticket reference
              </FieldLabel>
              <Input
                id="admin-user-profile-reason"
                value={form.reason}
                disabled={isSaving}
                placeholder="Support ticket or reason"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner data-icon="inline-start" /> : null}
                Update profile
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Member since {formatDateOnly(data.user.createdAt)}. Profile
              updated {formatDateTime(data.user.updatedAt)}.
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function getTicketReference(ticketId: string | null) {
  return ticketId && /^\d+$/.test(ticketId) ? `Support ticket #${ticketId}` : ""
}

function getInitialAccountMetadataForm(
  data: UserDetailsData,
  ticketReference: string
): AccountMetadataForm {
  return {
    role: data.user.role,
    dateOfBirth: data.user.dateOfBirth ?? "",
    reason: ticketReference,
  }
}

function getAccountMetadataFormKey(
  data: UserDetailsData,
  ticketReference: string
) {
  return [
    data.user.id,
    data.user.role,
    data.user.dateOfBirth ?? "",
    data.user.updatedAt,
    ticketReference,
  ].join(":")
}
