import { PortableText } from "@portabletext/react"
import { getCmsPage } from "@/lib/cms"

type Section = {
  heading?: string
  body?: string
}

type FaqItem = {
  question?: string
  answer?: string
}

export default async function CmsContentPage({ slug }: { slug: string }) {
  const page = await getCmsPage(slug)
  const sections = Array.isArray(page.content?.sections)
    ? (page.content.sections as Section[])
    : []
  const body = Array.isArray(page.content?.body) ? page.content.body : []
  const faqItems = Array.isArray(page.content?.items)
    ? (page.content.items as FaqItem[])
    : []

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        {page.summary ? (
          <p className="text-sm text-muted-foreground">{page.summary}</p>
        ) : null}
      </header>

      {faqItems.length > 0 ? (
        <section className="mt-8 space-y-4">
          {faqItems.map((item, index) => (
            <article key={index} className="rounded-lg border p-4">
              <h2 className="text-base font-semibold">
                {item.question || "Question"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.answer || ""}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {body.length > 0 ? (
        <section className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
          <PortableText value={body} />
        </section>
      ) : null}

      {sections.length > 0 ? (
        <section className="mt-8 space-y-4">
          {sections.map((section, index) => (
            <article key={index} className="rounded-lg border p-4">
              <h2 className="text-base font-semibold">
                {section.heading || "Section"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {section.body || ""}
              </p>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
