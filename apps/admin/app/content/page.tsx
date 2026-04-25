"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Separator } from "@workspace/ui/components/separator"
import { Switch } from "@workspace/ui/components/switch"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

type CmsPage = {
  id: number
  slug: string
  title: string
  summary: string | null
  content: Record<string, unknown>
  seoTitle: string | null
  seoDescription: string | null
  isPublished: boolean
  publishedAt: string | null
  updatedAt: string
}

type EmailTemplate = {
  id: number
  key: string
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string | null
  isActive: boolean
  updatedAt: string
}

const defaultPageSlugs = [
  "homepage",
  "faq",
  "terms",
  "privacy",
  "refund-policy",
  "contact",
]

const defaultTemplateKeys = [
  "welcome",
  "password_reset",
  "invoice_created",
  "payment_confirmed",
  "payment_failed",
  "instance_provisioned",
  "expiry_reminder",
  "admin_alert",
]

export default function AdminContentPage() {
  const queryClient = useQueryClient()
  const [selectedSlug, setSelectedSlug] = useState(defaultPageSlugs[0] ?? "homepage")
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(
    defaultTemplateKeys[0] ?? "welcome"
  )
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [contentJson, setContentJson] = useState("{}")
  const [isPublished, setIsPublished] = useState(false)
  const [subjectTemplate, setSubjectTemplate] = useState("")
  const [htmlTemplate, setHtmlTemplate] = useState("")
  const [textTemplate, setTextTemplate] = useState("")
  const [templateActive, setTemplateActive] = useState(true)

  const pagesQuery = useQuery<CmsPage[]>({
    queryKey: queryKeys.contentPages(),
    queryFn: () => clientApi("/admin/content/pages"),
  })

  const templatesQuery = useQuery<EmailTemplate[]>({
    queryKey: queryKeys.emailTemplates(),
    queryFn: () => clientApi("/admin/email-templates"),
  })

  const availableSlugs = useMemo(() => {
    const fromDb = new Set((pagesQuery.data ?? []).map((page) => page.slug))
    for (const slug of defaultPageSlugs) {
      fromDb.add(slug)
    }
    return Array.from(fromDb)
  }, [pagesQuery.data])

  const availableTemplateKeys = useMemo(() => {
    const fromDb = new Set(
      (templatesQuery.data ?? []).map((template) => template.key)
    )
    for (const key of defaultTemplateKeys) {
      fromDb.add(key)
    }
    return Array.from(fromDb)
  }, [templatesQuery.data])

  const selectedPage = (pagesQuery.data ?? []).find(
    (page) => page.slug === selectedSlug
  )
  const selectedTemplate = (templatesQuery.data ?? []).find(
    (template) => template.key === selectedTemplateKey
  )

  useEffect(() => {
    setTitle(selectedPage?.title ?? "")
    setSummary(selectedPage?.summary ?? "")
    setSeoTitle(selectedPage?.seoTitle ?? "")
    setSeoDescription(selectedPage?.seoDescription ?? "")
    setContentJson(
      JSON.stringify(selectedPage?.content ?? {}, null, 2)
    )
    setIsPublished(selectedPage?.isPublished ?? false)
  }, [selectedPage?.slug, selectedPage?.updatedAt])

  useEffect(() => {
    setSubjectTemplate(selectedTemplate?.subjectTemplate ?? "")
    setHtmlTemplate(selectedTemplate?.htmlTemplate ?? "")
    setTextTemplate(selectedTemplate?.textTemplate ?? "")
    setTemplateActive(selectedTemplate?.isActive ?? true)
  }, [selectedTemplate?.key, selectedTemplate?.updatedAt])

  const savePageMutation = useMutation({
    mutationFn: async () => {
      let parsedContent: Record<string, unknown> = {}

      try {
        parsedContent = JSON.parse(contentJson) as Record<string, unknown>
      } catch {
        throw new Error("Content JSON is invalid")
      }

      return clientApi(`/admin/content/pages/${selectedSlug}`, {
        method: "PUT",
        body: {
          title,
          summary: summary.trim().length > 0 ? summary : null,
          content: parsedContent,
          seoTitle: seoTitle.trim().length > 0 ? seoTitle : null,
          seoDescription:
            seoDescription.trim().length > 0 ? seoDescription : null,
          isPublished,
        },
      })
    },
    onSuccess: async () => {
      toast.success("CMS page saved")
      await queryClient.invalidateQueries({ queryKey: queryKeys.contentPages() })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save page")
    },
  })

  const saveTemplateMutation = useMutation({
    mutationFn: () =>
      clientApi(`/admin/email-templates/${selectedTemplateKey}`, {
        method: "PUT",
        body: {
          subjectTemplate,
          htmlTemplate,
          textTemplate: textTemplate.trim().length > 0 ? textTemplate : null,
          isActive: templateActive,
        },
      }),
    onSuccess: async () => {
      toast.success("Email template saved")
      await queryClient.invalidateQueries({
        queryKey: queryKeys.emailTemplates(),
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save template")
    },
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Legacy Content & Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Website content now lives in Sanity Studio. This page remains for
          internal templates and legacy content records.
        </p>
      </div>

      <Alert>
        <AlertTitle>Website CMS moved to Sanity</AlertTitle>
        <AlertDescription>
          Use <code>http://localhost:3000/studio</code> (or your web domain
          <code>/studio</code>) to edit homepage, FAQ, terms, privacy, refund
          policy, and contact pages.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">CMS Pages</h2>

            <div className="space-y-2">
              <Label htmlFor="cms-slug">Page</Label>
              <select
                id="cms-slug"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedSlug}
                onChange={(event) => setSelectedSlug(event.target.value)}
              >
                {availableSlugs.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-title">Title</Label>
              <Input
                id="cms-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-summary">Summary</Label>
              <Input
                id="cms-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-seo-title">SEO Title</Label>
              <Input
                id="cms-seo-title"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-seo-description">SEO Description</Label>
              <Textarea
                id="cms-seo-description"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-content-json">Content JSON</Label>
              <Textarea
                id="cms-content-json"
                value={contentJson}
                onChange={(event) => setContentJson(event.target.value)}
                className="min-h-56 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="cms-published">Published</Label>
              <Switch
                id="cms-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>

            <Button
              onClick={() => savePageMutation.mutate()}
              disabled={savePageMutation.isPending || pagesQuery.isLoading}
            >
              Save Page
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Email Templates</h2>

            <div className="space-y-2">
              <Label htmlFor="template-key">Template</Label>
              <select
                id="template-key"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedTemplateKey}
                onChange={(event) => setSelectedTemplateKey(event.target.value)}
              >
                {availableTemplateKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Template</Label>
              <Input
                id="template-subject"
                value={subjectTemplate}
                onChange={(event) => setSubjectTemplate(event.target.value)}
                placeholder="Example: Payment confirmed for {{invoiceNumber}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-html">HTML Template</Label>
              <Textarea
                id="template-html"
                value={htmlTemplate}
                onChange={(event) => setHtmlTemplate(event.target.value)}
                className="min-h-48 font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-text">Text Template</Label>
              <Textarea
                id="template-text"
                value={textTemplate}
                onChange={(event) => setTextTemplate(event.target.value)}
                className="min-h-28 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="template-active">Enabled</Label>
              <Switch
                id="template-active"
                checked={templateActive}
                onCheckedChange={setTemplateActive}
              />
            </div>

            <Button
              onClick={() => saveTemplateMutation.mutate()}
              disabled={
                saveTemplateMutation.isPending || templatesQuery.isLoading
              }
            >
              Save Template
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground">
        Template variables use <code>{"{{variableName}}"}</code> placeholders.
      </p>
    </section>
  )
}
