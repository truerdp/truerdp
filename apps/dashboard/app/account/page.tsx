"use client"

import { useProfile } from "@/hooks/use-profile"
import { AccountForm } from "@/components/account-page/account-form"
import { ProfileSkeleton } from "@/components/account-page/profile-skeleton"

export default function AccountPage() {
  const { data: profile, isLoading } = useProfile()

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
      <AccountForm profile={profile} />
    </div>
  )
}
