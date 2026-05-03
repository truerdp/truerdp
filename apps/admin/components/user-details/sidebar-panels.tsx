import { ComputerTerminalIcon } from "@hugeicons/core-free-icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ActiveInstanceLink,
  formatDateOnly,
  formatDateTime,
  formatStatusLabel,
  InsightRow,
  MetaRow,
  SectionEmpty,
  getActiveInstanceLinks,
} from "./helpers"
import type { Insight, UserDetailsData } from "./types"

interface UserDetailsSidebarProps {
  data: UserDetailsData
  insights: Insight[]
}

export function UserDetailsSidebar({ data, insights }: UserDetailsSidebarProps) {
  const { user, summary } = data
  const activeInstances = getActiveInstanceLinks(data.instances)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Signals</CardTitle>
          <CardDescription>
            Operator-ready observations pulled from the account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight) => (
            <InsightRow
              key={insight.title}
              title={insight.title}
              description={insight.description}
              tone={insight.tone}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Metadata</CardTitle>
          <CardDescription>
            Core identity and timing markers for the account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetaRow label="User ID" value={`#${user.id}`} />
          <MetaRow label="Role" value={formatStatusLabel(user.role)} />
          <MetaRow label="Member since" value={formatDateOnly(user.createdAt)} />
          <MetaRow label="Profile updated" value={formatDateTime(user.updatedAt)} />
          <MetaRow
            label="Last activity"
            value={formatDateTime(summary.lastActivityAt)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Service List</CardTitle>
          <CardDescription>
            Fast jump points into currently live infrastructure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeInstances.length === 0 ? (
            <SectionEmpty
              title="Nothing live right now"
              description="Active services will surface here once provisioning completes."
              icon={ComputerTerminalIcon}
            />
          ) : (
            activeInstances.map((instance) => (
              <ActiveInstanceLink
                key={instance.id}
                href={instance.href}
                id={instance.id}
                label={instance.label}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
