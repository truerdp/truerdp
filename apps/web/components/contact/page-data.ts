import { Plus_Jakarta_Sans } from "next/font/google"
import {
  DashboardSquare01Icon,
  Home03Icon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"

import { webPaths } from "@/lib/paths"

export const contactDisplayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
})

export const supportCards = [
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

export const supportTopics = [
  "Choosing CPU, RAM, storage, or location",
  "Checkout or payment confirmation questions",
  "Provisioning status after an order is placed",
  "Renewal, expiry, or billing clarification",
]

export const quickAnswers = [
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
