import Link from "next/link"

import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { TawkChatButton } from "@/components/tawk-chat-button"
import { webPaths } from "@/lib/paths"
import { contactDisplayFont, supportCards } from "./page-data"

interface ContactHeroAndCardsProps {
  title: string
}

export function ContactHeroAndCards({ title }: ContactHeroAndCardsProps) {
  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pt-10 md:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge
            variant="secondary"
            className="rounded-full border border-[oklch(0.78_0.08_205)] bg-[oklch(0.97_0.035_205)] px-4 py-1.5 text-[oklch(0.31_0.09_212)] dark:border-white/10 dark:bg-white/8 dark:text-white/80"
          >
            {title}
          </Badge>
          <h1
            className={`${contactDisplayFont.className} mt-5 max-w-3xl text-4xl leading-[1.04] tracking-tight text-[oklch(0.2_0.045_265)] md:text-5xl dark:text-white`}
          >
            Get help choosing, ordering, or managing your RDP plan
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[oklch(0.35_0.04_250)] md:text-lg dark:text-white/76">
            Talk to us about plan fit, billing, provisioning, checkout, or an
            active RDP workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TawkChatButton size="sm">Live support</TawkChatButton>
            <Link href={webPaths.faq}>
              <Button size="sm" variant="outline">
                Read FAQ
              </Button>
            </Link>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.23_0.06_252),oklch(0.18_0.04_245)_55%,oklch(0.22_0.065_198))] p-6 text-white shadow-2xl shadow-[oklch(0.45_0.1_220)]/20">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <p className="text-sm text-white/58">Support snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SnapshotCard title="Best for" value="Plan guidance" />
            <SnapshotCard title="Active issues" value="Tickets" />
            <SnapshotCard title="Payments" value="Billing help" />
            <div className="rounded-2xl border border-[oklch(0.7_0.12_166)]/35 bg-[oklch(0.3_0.08_170)]/35 p-4">
              <p className="text-xs text-white/55">Live chat</p>
              <p className="mt-1 text-xl font-semibold">Tawk.to</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-14 grid w-full max-w-6xl gap-4 px-6 md:grid-cols-3">
        {supportCards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative block overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 ${
              index === 1
                ? "border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_84),oklch(0.96_0.035_78))] dark:bg-[linear-gradient(150deg,oklch(0.23_0.048_72),oklch(0.17_0.035_250))]"
                : "border-[oklch(0.8_0.08_205)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_205),oklch(0.95_0.04_205))] dark:bg-[linear-gradient(150deg,oklch(0.23_0.055_218),oklch(0.17_0.035_250))]"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
            <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/70 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/10">
              <HugeiconsIcon icon={card.icon} size={20} strokeWidth={2} />
            </span>
            <h2 className="mt-5 text-xl font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {card.description}
            </p>
            <span className="mt-5 inline-flex text-sm font-medium text-[oklch(0.38_0.11_205)] transition-transform group-hover:translate-x-1 dark:text-[oklch(0.8_0.1_205)]">
              {card.action}
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto mt-14 w-full max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(135deg,oklch(0.96_0.042_205),oklch(0.95_0.035_78)_58%,oklch(0.96_0.032_166))] p-6 shadow-xl shadow-[oklch(0.55_0.1_220)]/12 md:p-8 dark:border-white/12 dark:bg-[linear-gradient(140deg,oklch(0.24_0.055_218),oklch(0.18_0.035_250))] dark:shadow-black/40">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
                Ready to continue?
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Compare plans before contacting support
              </h2>
            </div>
            <Link href={webPaths.plans}>
              <Button size="sm">
                <HugeiconsIcon
                  icon={CreditCardIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                View plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function SnapshotCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
      <p className="text-xs text-white/50">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}
