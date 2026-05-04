import { VerifyEmailSuccessCard } from "@/components/verify-email-success-card"
import { Suspense } from "react"

export default function VerifyEmailSuccessPage() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="h-96 w-full" />}>
          <VerifyEmailSuccessCard />
        </Suspense>
      </div>
    </div>
  )
}
