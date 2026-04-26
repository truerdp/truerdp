"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"
import EmailHtmlEditor from "@/components/email-html-editor"

type EmailTemplate = {
  id: number
  key: string
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string | null
  isActive: boolean
  updatedAt: string
}

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

type EmailTemplateSample = {
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string | null
  isActive: boolean
}

type TemplateDraft = {
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string
  isActive: boolean
}

const defaultEmailTemplateSamples: Record<string, EmailTemplateSample> = {
  welcome: {
    subjectTemplate: "Welcome to TrueRDP",
    htmlTemplate:
      "<h1>Welcome {{firstName}}</h1><p>Your TrueRDP account is ready.</p>",
    textTemplate: "Welcome {{firstName}}, your TrueRDP account is ready.",
    isActive: true,
  },
  password_reset: {
    subjectTemplate: "Reset your TrueRDP password",
    htmlTemplate:
      '<h1>Password reset</h1><p>Use this link to reset your password: <a href="{{resetUrl}}">{{resetUrl}}</a></p>',
    textTemplate:
      "Reset your password using this link: {{resetUrl}}. This link expires in 1 hour.",
    isActive: true,
  },
  invoice_created: {
    subjectTemplate: "Invoice {{invoiceNumber}} created",
    htmlTemplate:
      '<h1>Invoice created</h1><p>Hi {{firstName}}, invoice {{invoiceNumber}} for {{planName}} is ready.</p><p>Amount due: {{amount}}</p><p><a href="{{invoiceUrl}}">View invoice</a></p>',
    textTemplate:
      "Hi {{firstName}}, invoice {{invoiceNumber}} for {{planName}} is ready. Amount due: {{amount}}. View invoice: {{invoiceUrl}}",
    isActive: true,
  },
  payment_confirmed: {
    subjectTemplate: "Payment confirmed for {{invoiceNumber}}",
    htmlTemplate:
      '<h1>Payment confirmed</h1><p>Hi {{firstName}}, payment for {{invoiceNumber}} has been confirmed.</p><p>Amount: {{amount}}</p><p><a href="{{invoiceUrl}}">View receipt</a></p>',
    textTemplate:
      "Hi {{firstName}}, payment for {{invoiceNumber}} has been confirmed. Amount: {{amount}}. View receipt: {{invoiceUrl}}",
    isActive: true,
  },
  payment_failed: {
    subjectTemplate: "Payment failed for {{invoiceNumber}}",
    htmlTemplate:
      '<h1>Payment failed</h1><p>Hi {{firstName}}, payment for invoice {{invoiceNumber}} failed.</p><p>Reason: {{reason}}</p><p><a href="{{invoiceUrl}}">Retry payment</a></p>',
    textTemplate:
      "Hi {{firstName}}, payment for invoice {{invoiceNumber}} failed. Reason: {{reason}}. Retry payment: {{invoiceUrl}}",
    isActive: true,
  },
  instance_provisioned: {
    subjectTemplate: "Instance #{{instanceId}} is ready",
    htmlTemplate:
      '<h1>Your instance is ready</h1><p>Hi {{firstName}}, your {{planName}} instance is provisioned.</p><p>IP: {{ipAddress}}</p><p>Username: {{username}}</p><p><a href="{{instanceUrl}}">Open instance</a></p>',
    textTemplate:
      "Hi {{firstName}}, your {{planName}} instance is ready. IP: {{ipAddress}} Username: {{username}}. Open instance: {{instanceUrl}}",
    isActive: true,
  },
  expiry_reminder: {
    subjectTemplate:
      "Instance #{{instanceId}} expires in {{daysRemaining}} day(s)",
    htmlTemplate:
      '<h1>Expiry reminder</h1><p>Hi {{firstName}}, your {{planName}} instance expires on {{expiryDate}}.</p><p><a href="{{instanceUrl}}">Review instance</a></p>',
    textTemplate:
      "Hi {{firstName}}, your {{planName}} instance expires on {{expiryDate}}. Review instance: {{instanceUrl}}",
    isActive: true,
  },
  admin_alert: {
    subjectTemplate: "{{subject}}",
    htmlTemplate: "<h1>Admin alert</h1><p>{{text}}</p><p>{{html}}</p>",
    textTemplate: "{{text}}",
    isActive: true,
  },
}

const fallbackSample: EmailTemplateSample = {
  subjectTemplate: "New template",
  htmlTemplate: "<p>{{text}}</p>",
  textTemplate: "{{text}}",
  isActive: true,
}

function getSampleTemplate(key: string): EmailTemplateSample {
  return defaultEmailTemplateSamples[key] ?? fallbackSample
}

const previewVariables: Record<string, string> = {
  firstName: "Alex",
  resetUrl: "https://dashboard.truerdp.com/reset-password?token=demo-token",
  invoiceNumber: "INV-2026-0042",
  planName: "Starter RDP",
  amount: "$40.00",
  invoiceUrl: "https://dashboard.truerdp.com/invoices/42",
  reason: "Insufficient funds",
  instanceId: "108",
  ipAddress: "203.0.113.25",
  username: "administrator",
  instanceUrl: "https://dashboard.truerdp.com/instances/108",
  expiryDate: "Apr 30, 2026 12:00 PM",
  daysRemaining: "5",
  subject: "Instance suspended by admin",
  text: "A new operational alert has been generated.",
  html: "<strong>Review instance actions in admin.</strong>",
}

function interpolateTemplate(
  template: string,
  variables: Record<string, string>
) {
  return template.replaceAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return variables[key] ?? `{{${key}}}`
  })
}

type TemplateEditorFormProps = {
  templateKey: string
  availableTemplateKeys: string[]
  source: EmailTemplateSample
  onTemplateKeyChange: (value: string | null) => void
  onSave: (draft: TemplateDraft) => void
  isSaving: boolean
  isLoading: boolean
}

function TemplateEditorForm({
  templateKey,
  availableTemplateKeys,
  source,
  onTemplateKeyChange,
  onSave,
  isSaving,
  isLoading,
}: TemplateEditorFormProps) {
  const [subjectTemplate, setSubjectTemplate] = useState(source.subjectTemplate)
  const [htmlTemplate, setHtmlTemplate] = useState(source.htmlTemplate)
  const [textTemplate, setTextTemplate] = useState(source.textTemplate ?? "")
  const [templateActive, setTemplateActive] = useState(source.isActive)

  const previewSubject = useMemo(
    () => interpolateTemplate(subjectTemplate, previewVariables),
    [subjectTemplate]
  )
  const previewHtml = useMemo(
    () => interpolateTemplate(htmlTemplate, previewVariables),
    [htmlTemplate]
  )
  const previewText = useMemo(
    () => interpolateTemplate(textTemplate, previewVariables),
    [textTemplate]
  )
  const previewSrcDoc = useMemo(
    () =>
      `<!doctype html><html><body style="margin:0;padding:20px;font-family:Arial,sans-serif;color:#111827;line-height:1.5;background:#ffffff;">${previewHtml}</body></html>`,
    [previewHtml]
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full space-y-2 md:max-w-sm">
            <Label htmlFor="template-key">Template</Label>
            <Select value={templateKey} onValueChange={onTemplateKeyChange}>
              <SelectTrigger id="template-key" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplateKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 md:pb-1">
            <Label htmlFor="template-active">Enabled</Label>
            <Switch
              id="template-active"
              checked={templateActive}
              onCheckedChange={setTemplateActive}
            />
          </div>
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
          <Label>HTML Template</Label>
          <EmailHtmlEditor
            value={htmlTemplate}
            onChange={setHtmlTemplate}
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

        <Button
          onClick={() =>
            onSave({
              subjectTemplate,
              htmlTemplate,
              textTemplate,
              isActive: templateActive,
            })
          }
          disabled={isSaving || isLoading}
        >
          Save Template
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/10 p-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Live Preview</h2>
          <p className="text-xs text-muted-foreground">
            Placeholders are rendered with sample values.
          </p>
        </div>
        <div className="mb-4 rounded-md border bg-background p-3">
          <p className="text-xs text-muted-foreground">Subject</p>
          <p className="text-sm font-medium">{previewSubject}</p>
        </div>
        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="mt-3">
            <iframe
              title="email-html-preview"
              className="h-96 w-full rounded-md border bg-white"
              srcDoc={previewSrcDoc}
            />
          </TabsContent>
          <TabsContent value="text" className="mt-3">
            <pre className="h-96 overflow-auto rounded-md border bg-background p-3 text-xs whitespace-pre-wrap">
              {previewText}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

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
