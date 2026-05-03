import { useMemo, useState } from "react"
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
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import EmailHtmlEditor from "@/components/email-html-editor"
import {
  interpolateTemplate,
  previewVariables,
  type EmailTemplateSample,
  type TemplateDraft,
} from "@/app/content/models"

type TemplateEditorFormProps = {
  templateKey: string
  availableTemplateKeys: string[]
  source: EmailTemplateSample
  onTemplateKeyChange: (value: string | null) => void
  onSave: (draft: TemplateDraft) => void
  isSaving: boolean
  isLoading: boolean
}

export function TemplateEditorForm({
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
  const availableVariables = useMemo(() => Object.keys(previewVariables), [])
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
            variableTokens={availableVariables}
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
