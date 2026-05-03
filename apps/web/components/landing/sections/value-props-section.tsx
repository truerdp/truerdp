import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  Invoice03Icon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/landing/reveal"
import { sectionEyebrowClass, valuePropStyles } from "./styles"
import type { SectionIntro, ValueProp } from "./types"

interface ValuePropsSectionProps {
  section: SectionIntro
  valueProps: ValueProp[]
}

export function ValuePropsSection({
  section,
  valueProps,
}: ValuePropsSectionProps) {
  const icons = [ServerStack01Icon, CreditCardIcon, Invoice03Icon]

  return (
    <section className="mx-auto mt-14 w-full max-w-6xl px-6">
      <Reveal className="mb-5 flex max-w-3xl flex-col gap-2">
        <p className={sectionEyebrowClass}>{section.eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {section.headline}
        </h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-3">
        {valueProps.map((item, index) => (
          <Reveal key={item.title} delayMs={index * 80}>
            <article
              className={`group h-full rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                valuePropStyles[index % valuePropStyles.length]?.card ?? ""
              } dark:border-white/10`}
            >
              <span
                className={`inline-flex size-10 items-center justify-center rounded-2xl ${
                  valuePropStyles[index % valuePropStyles.length]?.icon ?? ""
                } dark:bg-white/10 dark:text-white`}
              >
                <HugeiconsIcon
                  icon={icons[index % icons.length] || ServerStack01Icon}
                  size={20}
                  strokeWidth={2}
                />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/70 dark:text-white/65">
                {item.description}
              </p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,oklch(0.66_0.13_205),oklch(0.72_0.12_166))] transition-all group-hover:w-full" />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
