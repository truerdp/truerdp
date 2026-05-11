"use client"

import { FormEvent, useState } from "react"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

type ContactTopic =
  | "plan_guidance"
  | "billing"
  | "provisioning"
  | "technical_issue"
  | "other"

type ContactPayload = {
  name: string
  email: string
  subject: string
  message: string
  topic: ContactTopic
  companyName: string
  orderReference: string
  website: string
}

const initialForm: ContactPayload = {
  name: "",
  email: "",
  subject: "",
  message: "",
  topic: "other",
  companyName: "",
  orderReference: "",
  website: "",
}

export function ContactFormCard() {
  const [form, setForm] = useState<ContactPayload>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim()) {
      setError("Please complete all required fields.")
      return
    }

    if (form.message.trim().length < 10) {
      setError("Please add a short message with at least 10 characters.")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await clientApi<{ message: string }>("/support/contact", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          topic: form.topic,
          companyName: form.companyName.trim() || null,
          orderReference: form.orderReference.trim() || null,
          website: form.website.trim(),
        },
      })

      setSuccessMessage(response.message)
      toast.success(response.message)
      setForm(initialForm)
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit contact request"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/7">
      <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
        Send a message
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
        Contact support directly from this page
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Use this form for pre-sales and account help. For active service
        incidents, open a dashboard ticket for tracked updates.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contact-name">Name</FieldLabel>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Your name"
                disabled={isSubmitting}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="you@company.com"
                disabled={isSubmitting}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contact-topic">Topic</FieldLabel>
              <select
                id="contact-topic"
                value={form.topic}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    topic: event.target.value as ContactTopic,
                  }))
                }
                disabled={isSubmitting}
                className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <option value="plan_guidance">Plan guidance</option>
                <option value="billing">Billing</option>
                <option value="provisioning">Provisioning</option>
                <option value="technical_issue">Technical issue</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-subject">Subject</FieldLabel>
              <Input
                id="contact-subject"
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="What can we help with?"
                disabled={isSubmitting}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contact-company">Company (optional)</FieldLabel>
              <Input
                id="contact-company"
                value={form.companyName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    companyName: event.target.value,
                  }))
                }
                placeholder="Company name"
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-order-reference">
                Order/Invoice (optional)
              </FieldLabel>
              <Input
                id="contact-order-reference"
                value={form.orderReference}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    orderReference: event.target.value,
                  }))
                }
                placeholder="Order # / Invoice #"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="contact-message">Message</FieldLabel>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message: event.target.value }))
              }
              placeholder="Share your question or issue details..."
              disabled={isSubmitting}
              required
            />
            <FieldDescription>
              Include any relevant plan name, location, and timeline expectations.
            </FieldDescription>
          </Field>

          <input
            type="text"
            value={form.website}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, website: event.target.value }))
            }
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            Send message
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
