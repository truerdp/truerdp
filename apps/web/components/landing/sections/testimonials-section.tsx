import { Reveal } from "@/components/landing/reveal"
import { sectionEyebrowClass, valuePropStyles } from "./styles"
import type { TestimonialsContent } from "./types"

interface TestimonialsSectionProps {
  displayClassName: string
  content: TestimonialsContent
}

export function TestimonialsSection({
  displayClassName,
  content,
}: TestimonialsSectionProps) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className={sectionEyebrowClass}>{content.eyebrow}</p>
          <h2
            className={`${displayClassName} mt-2 text-2xl tracking-tight md:text-3xl`}
          >
            {content.headline}
          </h2>
        </div>
        <div className="rounded-2xl border border-[oklch(0.84_0.07_78)]/70 bg-white/75 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/8">
          <p className="text-2xl leading-none text-[oklch(0.66_0.14_78)]">
            ★★★★★
          </p>
          <p className="mt-1 text-sm font-medium">{content.ratingLabel}</p>
        </div>
      </Reveal>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {content.items.map((testimonial, index) => (
          <Reveal key={testimonial.name} delayMs={index * 80}>
            <article
              className={`h-full rounded-2xl border p-5 shadow-sm ${
                valuePropStyles[index % valuePropStyles.length]?.card ?? ""
              } dark:border-white/10`}
            >
              <p className="text-lg leading-none text-[oklch(0.66_0.14_78)]">
                ★★★★★
              </p>
              <p className="mt-4 text-sm leading-6 text-foreground/78 dark:text-white/72">
                “{testimonial.quote}”
              </p>
              <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
