import { Reveal } from "@/components/landing/reveal"
import { sectionEyebrowClass } from "./styles"
import type { JourneySectionContent } from "./types"

interface JourneySectionProps {
  displayClassName: string
  content: JourneySectionContent
}

export function JourneySection({
  displayClassName,
  content,
}: JourneySectionProps) {
  return (
    <section
      id="how-it-works"
      className="mx-auto mt-32 mb-24 w-full max-w-6xl scroll-mt-20 px-6"
    >
      <Reveal className="mb-20">
        <p className={sectionEyebrowClass}>{content.eyebrow}</p>
        <div className="grid gap-4 *:min-w-0 md:grid-cols-12 md:items-end md:gap-12">
          <h2
            className={`${displayClassName} col-span-12 text-2xl leading-[1.1] text-foreground md:col-span-7 md:text-6xl md:tracking-tighter`}
          >
            {content.headline}
          </h2>
          {content.description ? (
            <p className="col-span-12 text-lg leading-relaxed text-muted-foreground md:col-span-5 md:pb-2">
              {content.description}
            </p>
          ) : null}
        </div>
      </Reveal>

      <div className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/10 md:flex-row md:divide-x md:divide-y-0">
        {content.steps.map((step, index) => (
          <Reveal
            key={step.title}
            delayMs={index * 150}
            className="group flex-1"
          >
            <article className="relative flex h-full flex-col overflow-hidden p-8 py-12 transition-colors duration-500 hover:bg-foreground/2 md:p-12 dark:hover:bg-white/2">
              <span className="absolute -top-8 -right-8 text-[16rem] leading-none font-light tracking-tighter text-foreground/3 transition-all duration-700 select-none group-hover:-translate-y-4 group-hover:text-foreground/6 dark:text-white/2 dark:group-hover:text-white/5">
                {index + 1}
              </span>

              <div className="relative mt-6">
                <p className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground">
                  STEP 0{index + 1}
                </p>
                <h3 className="mb-4 text-2xl font-medium tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                {step.details.length > 0 ? (
                  <div className="mt-8 hidden md:block">
                    <p className="mb-4 font-mono text-[0.68rem] font-semibold tracking-widest text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
                      What happens
                    </p>
                    <ul className="grid gap-3">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex gap-3 text-sm leading-6 text-foreground/75 dark:text-white/70"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[oklch(0.68_0.13_205)] shadow-[0_0_14px_oklch(0.68_0.13_205/0.45)]" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
