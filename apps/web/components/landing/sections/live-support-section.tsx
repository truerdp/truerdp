import { Reveal } from "@/components/landing/reveal"
import type { LiveSupportContent } from "./types"

export function LiveSupportSection({
  displayClassName,
  content,
}: {
  displayClassName: string
  content: LiveSupportContent
}) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.23_0.06_252),oklch(0.18_0.04_245)_55%,oklch(0.22_0.065_198))] p-6 text-white shadow-xl shadow-[oklch(0.45_0.1_220)]/18 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">
                {content.eyebrow}
              </p>
              <h2
                className={`${displayClassName} mt-2 text-2xl tracking-tight md:text-3xl`}
              >
                {content.headline}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
                {content.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {content.topics.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/12 bg-white/8 p-4"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
