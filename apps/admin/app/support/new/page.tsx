import { CreateTicketForm } from "@/app/support/new/create-ticket-form"

export default function NewAdminSupportTicketPage() {
  return (
    <section className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create new ticket</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Open a support thread on behalf of a customer.
        </p>
      </div>
      <CreateTicketForm />
    </section>
  )
}
