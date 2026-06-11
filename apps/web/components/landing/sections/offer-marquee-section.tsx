import { HugeiconsIcon } from "@hugeicons/react"
import { Notification01Icon } from "@hugeicons/core-free-icons"

import { Marquee } from "@workspace/ui/components/marquee"

interface OfferMarqueeSectionProps {
  message: string
}

export function OfferMarqueeSection({ message }: OfferMarqueeSectionProps) {
  const items = Array.from({ length: 6 }, () => message)

  return (
    <section className="mx-auto mt-12 w-full">
      <div className="overflow-hidden border bg-blue-900 shadow-sm">
        <Marquee pauseOnHover className="py-5">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-base font-medium text-white/90 shadow-sm lg:text-lg"
            >
              <HugeiconsIcon
                icon={Notification01Icon}
                size={14}
                strokeWidth={2}
              />
              {item}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
