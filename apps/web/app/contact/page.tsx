import type { Metadata } from "next"
import Link from "next/link"
import { Plus_Jakarta_Sans } from "next/font/google"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkBadgeIcon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Home03Icon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { TawkChatButton } from "@/components/tawk-chat-button"
import { getCmsPage } from "@/lib/cms"
import { webPaths } from "@/lib/paths"

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
})

const supportCards = [
  {
    title: "Live chat",
    description:
      "Use the chat bubble for pre-sale questions, plan fit, and quick order guidance.",
    action: "Look for the chat bubble",
    href: "#live-support",
    icon: Home03Icon,
  },
  {
    title: "Dashboard tickets",
    description:
      "Open a ticket from your dashboard when you need issue tracking for an active service.",
    action: "Sign in",
    href: webPaths.login,
    icon: DashboardSquare01Icon,
  },
  {
    title: "Billing questions",
    description:
      "For payment status, renewals, checkout issues, or invoice questions, include your order context.",
    action: "Read billing FAQ",
    href: webPaths.faq,
    icon: Invoice03Icon,
  },
]

const supportTopics = [
  "Choosing CPU, RAM, storage, or location",
  "Checkout or payment confirmation questions",
  "Provisioning status after an order is placed",
  "Renewal, expiry, or billing clarification",
]

const quickAnswers = [
  {
    question: "What should I include when contacting support?",
    answer:
      "Share your account email, order or transaction context, selected plan, and a short description of what you need help with.",
  },
  {
    question: "Where should active customers report issues?",
    answer:
      "Use dashboard support tickets for tracked service issues. Live chat is best for quick guidance and pre-sale questions.",
  },
  {
    question: "Can support help me choose a location?",
    answer:
      "Yes. Tell support where your workload runs and what latency or region preference matters most.",
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("contact")
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary || "Contact and support",
  }
}

export default async function ContactPage() {
  const page = await getCmsPage("contact")

  return (
    <main className="relative isolate flex-1 overflow-hidden bg-[linear-gradient(180deg,oklch(0.985_0.022_205)_0%,oklch(0.975_0.02_84)_48%,oklch(0.985_0.018_166)_100%)] pb-14 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252)_0%,oklch(0.14_0.032_240)_54%,oklch(0.16_0.036_220)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 bg-[linear-gradient(115deg,oklch(0.95_0.05_78/0.56)_0%,transparent_34%),linear-gradient(245deg,oklch(0.82_0.075_205/0.42)_0%,transparent_44%)]" />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pt-10 md:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge
            variant="secondary"
            className="rounded-full border border-[oklch(0.78_0.08_205)] bg-[oklch(0.97_0.035_205)] px-4 py-1.5 text-[oklch(0.31_0.09_212)] dark:border-white/10 dark:bg-white/8 dark:text-white/80"
          >
            {page.title}
          </Badge>
          <h1
            className={`${displayFont.className} mt-5 max-w-3xl text-4xl leading-[1.04] tracking-tight text-[oklch(0.2_0.045_265)] md:text-5xl dark:text-white`}
          >
            Get help choosing, ordering, or managing your RDP plan
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[oklch(0.35_0.04_250)] md:text-lg dark:text-white/76">
            Talk to us about plan fit, billing, provisioning, checkout, or an
            active RDP workspace. We will route you to the fastest support path
            for the kind of help you need.
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
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Best for</p>
              <p className="mt-1 text-xl font-semibold">Plan guidance</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Active issues</p>
              <p className="mt-1 text-xl font-semibold">Tickets</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Payments</p>
              <p className="mt-1 text-xl font-semibold">Billing help</p>
            </div>
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
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                If you already know the workload and location you need, the plan
                catalog is the fastest next step.
              </p>
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
    </main>
  )
}
