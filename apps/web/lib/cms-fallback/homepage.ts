import type { CmsPage } from "@/lib/cms-types"

export const fallbackHomepagePage: CmsPage = {
  slug: "homepage",
  title: "TrueRDP Plans",
  summary: "Browse plans and start checkout.",
  content: {
    hero: {
      badge: "Instant setup workflow",
      headline: "Choose a TrueRDP plan and start your order in minutes",
      description:
        "Select duration, pick a payment method, and generate a transaction. Provisioning is handled by admin confirmation in the current flow.",
      primaryCtaLabel: "Start checkout",
      secondaryCtaLabel: "How it works",
      trustLine:
        "Low-latency infrastructure with transparent plan comparisons.",
    },
    valueProps: [
      {
        title: "Performance-first plans",
        description:
          "Concrete CPU, RAM, and storage specs make infrastructure choices predictable.",
      },
      {
        title: "Straightforward purchase flow",
        description:
          "Plan selection and checkout initiation are optimized for low friction.",
      },
      {
        title: "Location and type clarity",
        description:
          "Plan grouping by type and geography keeps decision-making quick and transparent.",
      },
    ],
    valuePropsSection: {
      eyebrow: "Why teams choose TrueRDP",
      headline:
        "Built for buyers who want the right machine without a long sales loop",
    },
    journeySection: {
      eyebrow: "How it works",
      headline: "From selection to server access in three clear steps",
      description:
        "The buying path stays simple for customers: compare the plan, complete checkout, and let support finish provisioning.",
      steps: [
        {
          title: "Choose",
          description:
            "Compare CPU, RAM, storage, duration, and region before selecting the right RDP plan.",
          details: [
            "Start with plan type, location, and resource requirements.",
            "Review available durations and starting price before checkout.",
            "Use the comparison table if you need to scan every spec side-by-side.",
          ],
        },
        {
          title: "Checkout",
          description:
            "Create the order through the guided checkout flow with the plan details already confirmed.",
          details: [
            "Confirm the selected duration and plan price.",
            "Sign in or create an account so the order stays attached to you.",
            "Move into the secure payment review flow without repeating plan details.",
          ],
        },
        {
          title: "Provision",
          description:
            "After payment confirmation, support prepares access and follows through on setup.",
          details: [
            "Payment confirmation creates the provisioning request for the team.",
            "Support assigns the matching RDP resources from available inventory.",
            "Access details and next steps are handled through the customer flow.",
          ],
        },
      ],
    },
    sections: {
      featuredPlansTitle: "Featured plans",
      featuredPlansDescription:
        "Compare entry prices and launch the right environment in minutes.",
      planGroupsTitle: "Plans by Type",
      planLocationsTitle: "Plans by Location",
      comparisonTitle: "Plan comparison",
      comparisonDescription:
        "Use this matrix to compare plan resources and locations before checkout.",
    },
    locationSection: {
      eyebrow: "Deployment locations",
      headline:
        "Pick the region that keeps your RDP workflow close to where it runs",
      description:
        "Browse active availability by geography, then compare the matching plan resources and durations.",
      footerTitle: "Plans by Location",
      footerDescription: "Location cards update from active backend inventory.",
      ctaLabel: "Browse all plans",
    },
    testimonialsSection: {
      eyebrow: "5 star rated experience",
      headline: "Trusted by buyers who need clear specs and quick checkout",
      ratingLabel: "Rated 5.0 by customers",
      items: [
        {
          quote:
            "The plan cards made it easy to compare capacity and get into checkout without a slow quote process.",
          name: "Arjun M.",
          role: "Automation operator",
        },
        {
          quote:
            "We needed remote Windows capacity quickly. TrueRDP gave us clear durations, specs, and locations up front.",
          name: "Meera S.",
          role: "Operations lead",
        },
        {
          quote:
            "The buying flow is simple, and the resource details are visible before payment. That saves a lot of back-and-forth.",
          name: "Daniel K.",
          role: "Trading desk admin",
        },
      ],
    },
    faqPreviewSection: {
      eyebrow: "Quick answers",
      headline: "Know what happens before you choose a plan",
      description:
        "The common buying questions are answered up front, and the full FAQ is available when you need more detail.",
      ctaLabel: "Open full FAQ",
      items: [
        {
          question: "How quickly can I place an order?",
          answer:
            "Choose a plan duration, start checkout, and the order is created in the same flow. Provisioning follows the current admin confirmation process.",
        },
        {
          question: "Can I compare plans by location?",
          answer:
            "Yes. The homepage and plans catalog both group inventory by plan type and deployment location so you can evaluate latency and geography before checkout.",
        },
        {
          question: "What details are shown before payment?",
          answer:
            "Plan cards show CPU, RAM, storage, location, plan type, and available durations so you can choose without hidden assumptions.",
        },
      ],
    },
    liveSupportSection: {
      eyebrow: "Live support",
      headline: "Need help choosing capacity? Chat with support before checkout.",
      description:
        "Tawk.to live chat is ready for the marketing site. Use the chat widget for plan fit, order questions, and provisioning status.",
      topics: [
        {
          title: "Plan fit",
          description: "Support for buyers and active customers.",
        },
        {
          title: "Order questions",
          description: "Support for buyers and active customers.",
        },
        {
          title: "Provisioning status",
          description: "Support for buyers and active customers.",
        },
      ],
    },
    finalCta: {
      headline: "Ready to launch your next RDP workspace?",
      description:
        "Select the right plan and move from browsing to order creation in a single streamlined flow.",
      primaryCtaLabel: "Start now",
      secondaryCtaLabel: "Contact support",
    },
  },
  seoTitle: "TrueRDP Plans",
  seoDescription:
    "Browse TrueRDP hosting plans, compare pricing, and start checkout instantly.",
}
