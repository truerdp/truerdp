import { Suspense } from "react"
import { VerifyEmailCard } from "@/components/verify-email-card"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="h-96 w-full" />}>
          <VerifyEmailCard />
        </Suspense>
      </div>
    </div>
  )
}
