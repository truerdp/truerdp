import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadgeIcon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"

import { TawkChatButton } from "@/components/tawk-chat-button"
import { webPaths } from "@/lib/paths"
import { quickAnswers, supportTopics } from "./page-data"

export function ContactSupportSections() {
  return (
    <>
      <section
        id="live-support"
        className="mx-auto mt-14 grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[1fr_0.9fr]"
      >
        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/7">
          <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
            Live support
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Use the chat bubble for quick questions before checkout
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Tawk.to live chat is available on the marketing site. If the support
            team is offline, leave your message there and include enough order
            or plan context for a useful reply.
          </p>
          <div className="mt-5">
            <TawkChatButton size="sm">Open live chat</TawkChatButton>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {supportTopics.map((topic) => (
              <div
                key={topic}
                className="flex gap-3 rounded-2xl border border-white/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/7"
              >
                <HugeiconsIcon
                  icon={CheckmarkBadgeIcon}
                  size={18}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-[oklch(0.42_0.11_166)]"
                />
                <p className="text-sm text-foreground/78 dark:text-white/72">
                  {topic}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_84),oklch(0.96_0.035_78))] p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-[linear-gradient(150deg,oklch(0.23_0.048_72),oklch(0.17_0.035_250))]">
          <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
            Before you write
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Share the details that help support answer faster
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              "Your account email",
              "Order, transaction, or plan name",
              "Preferred location or current server region",
              "A short description of the issue or question",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm font-medium dark:border-white/10 dark:bg-white/7"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
            Common questions
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Support routes are simple once you know what you need
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Start with chat for quick guidance, use tickets for tracked active
            service issues, or browse the FAQ for billing and provisioning
            basics.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={webPaths.plans}>
              <Button size="sm" variant="outline">
                Browse plans
              </Button>
            </Link>
            <Link href={webPaths.faq}>
              <Button size="sm" variant="outline">
                Open FAQ
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          {quickAnswers.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/7"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-lg text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
