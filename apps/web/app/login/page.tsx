import { Suspense } from "react"
import { GuestOnlyAuthGuard } from "@/components/auth/guest-only-auth-guard"
import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-96 w-full" />}>
          <GuestOnlyAuthGuard>
            <LoginForm />
          </GuestOnlyAuthGuard>
        </Suspense>
      </div>
    </div>
  )
}
