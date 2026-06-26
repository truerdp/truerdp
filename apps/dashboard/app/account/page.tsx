"use client"

import { useProfile } from "@/hooks/use-profile"
import { AccountForm } from "@/components/account-page/account-form"
import { ChangePasswordForm } from "@/components/account-page/change-password-form"
import { ProfileSkeleton } from "@/components/account-page/profile-skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

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
      <Tabs defaultValue="profile" className="space-y-2">
        <TabsList className="gap-4">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
          <AccountForm profile={profile} />
        </TabsContent>
        <TabsContent value="password" className="space-y-6">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
