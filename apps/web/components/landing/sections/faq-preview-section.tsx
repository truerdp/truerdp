import Link from "next/link"

import { Reveal } from "@/components/landing/reveal"
import { webPaths } from "@/lib/paths"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import { sectionEyebrowClass } from "./styles"
import type { FaqPreviewContent } from "./types"

export function FaqPreviewSection({
  displayClassName,
  content,
}: {
  displayClassName: string
  content: FaqPreviewContent
}) {
  return (
    <section className="mx-auto mt-16 grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Reveal className="flex flex-col gap-3">
        <p className={sectionEyebrowClass}>{content.eyebrow}</p>
        <h2
          className={`${displayClassName} text-2xl tracking-tight md:text-3xl`}
        >
          {content.headline}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {content.description}
        </p>
        <Link href={webPaths.faq}>
          <Button size="sm" variant="outline" className="w-fit">
            {content.ctaLabel}
          </Button>
        </Link>
      </Reveal>

      <Reveal>
        <Accordion
          defaultValue={
            content.items?.[0]?.question
              ? [content.items?.[0]?.question]
              : undefined
          }
          className="w-full space-y-2 border-0"
        >
          {content.items.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="rounded-2xl border bg-white/70 px-4 dark:border-white/10 dark:bg-white/7"
            >
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}
