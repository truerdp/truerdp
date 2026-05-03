"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { TemplateEditorForm } from "@/app/content/_components/template-editor-form"
import {
  defaultTemplateKeys,
  getSampleTemplate,
  type EmailTemplate,
  type TemplateDraft,
} from "@/app/content/models"
import { queryKeys } from "@/lib/query-keys"

export default function AdminContentPage() {
  const queryClient = useQueryClient()
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(
    defaultTemplateKeys[0] ?? "welcome"
  )
  const webBaseUrl =
    process.env.NEXT_PUBLIC_WEB_URL?.trim() || "http://localhost:3000"

  const templatesQuery = useQuery<EmailTemplate[]>({
    queryKey: queryKeys.emailTemplates(),
    queryFn: () => clientApi("/admin/email-templates"),
  })

  const availableTemplateKeys = useMemo(() => {
    const fromDb = new Set(
      (templatesQuery.data ?? []).map((template) => template.key)
    )
    for (const key of defaultTemplateKeys) {
      fromDb.add(key)
    }
    return Array.from(fromDb)
  }, [templatesQuery.data])

  const selectedTemplate = (templatesQuery.data ?? []).find(
    (template) => template.key === selectedTemplateKey
  )
  const sampleTemplate = useMemo(
    () => getSampleTemplate(selectedTemplateKey),
    [selectedTemplateKey]
  )
  const source = selectedTemplate ?? sampleTemplate
  const templateEditorKey = `${selectedTemplateKey}-${selectedTemplate?.updatedAt ?? "sample"}`

  const saveTemplateMutation = useMutation({
    mutationFn: (draft: TemplateDraft) =>
      clientApi(`/admin/email-templates/${selectedTemplateKey}`, {
        method: "PUT",
        body: {
          subjectTemplate: draft.subjectTemplate,
          htmlTemplate: draft.htmlTemplate,
          textTemplate:
            draft.textTemplate.trim().length > 0 ? draft.textTemplate : null,
          isActive: draft.isActive,
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
        <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-sm text-muted-foreground">
          Configure email subjects and bodies used for transactional
          notifications.
        </p>
      </div>

      <Alert>
        <AlertTitle>Website CMS moved to Sanity</AlertTitle>
        <AlertDescription>
          To edit website content, go to <code>{webBaseUrl}/studio</code>.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border p-4">
        {!selectedTemplate ? (
          <Alert className="mb-6">
            <AlertTitle>Using sample template</AlertTitle>
            <AlertDescription>
              No saved template found for this key yet. You are editing a
              prefilled sample; click save to persist it.
            </AlertDescription>
          </Alert>
        ) : null}

        <TemplateEditorForm
          key={templateEditorKey}
          templateKey={selectedTemplateKey}
          availableTemplateKeys={availableTemplateKeys}
          source={source}
          onTemplateKeyChange={(value) => {
            if (value) {
              setSelectedTemplateKey(value)
            }
          }}
          onSave={(draft) => saveTemplateMutation.mutate(draft)}
          isSaving={saveTemplateMutation.isPending}
          isLoading={templatesQuery.isLoading}
        />
      </div>
    </section>
  )
}
