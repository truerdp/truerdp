"use client"

import { FormEvent, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { useProfile, type Profile } from "@/hooks/use-profile"
import { queryKeys } from "@/lib/query-keys"

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

export default function AccountPage() {
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useProfile()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!profile) {
      return
    }

    setFirstName(profile.firstName ?? "")
    setLastName(profile.lastName ?? "")
    setEmail(profile.email)
  }, [profile])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Name and email are required.")
      return
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters.")
        return
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.")
        return
      }

      if (!currentPassword) {
        setError("Current password is required to change password.")
        return
      }
    }

    try {
      setIsSaving(true)
      const updated = await clientApi<Profile>("/profile", {
        method: "PATCH",
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        },
      })

      queryClient.setQueryData(queryKeys.profile(), updated)
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile() })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Profile updated")
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to update profile"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and password.
          </p>
        </div>
        <ProfileSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your dashboard profile and sign-in password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            Keep your account identity current for billing, support, and
            dashboard access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="first-name">First name</FieldLabel>
                  <Input
                    id="first-name"
                    value={firstName}
                    disabled={isSaving}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                  <Input
                    id="last-name"
                    value={lastName}
                    disabled={isSaving}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled={isSaving}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <FieldDescription>
                  This email is used for login and account communication.
                </FieldDescription>
              </Field>

              <Separator />

              <div className="space-y-1">
                <h2 className="text-base font-semibold">Change password</h2>
                <p className="text-sm text-muted-foreground">
                  Leave these fields blank if you only want to update profile
                  details.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="current-password">
                  Current password
                </FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  disabled={isSaving}
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    disabled={isSaving}
                    autoComplete="new-password"
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm new password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    disabled={isSaving}
                    autoComplete="new-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </Field>
              </div>

              {error ? <FieldError>{error}</FieldError> : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Spinner data-icon="inline-start" />}
                  Save changes
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
