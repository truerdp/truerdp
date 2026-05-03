import { and, eq, gte, inArray, lt } from "drizzle-orm"
import { db } from "../../db.js"
import { instances, plans, users } from "../../schema.js"
import { sendExpiryReminderEmail } from "../email.js"

export async function sendExpiryReminderSweep(input?: {
  daysAhead?: number
  now?: Date
}) {
  const now = input?.now ?? new Date()
  const daysAhead = Math.max(1, Math.min(input?.daysAhead ?? 3, 30))
  const upperBound = new Date(now)
  upperBound.setDate(upperBound.getDate() + daysAhead)

  const rows = await db
    .select({
      instance: {
        id: instances.id,
        expiryDate: instances.expiryDate,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
      plan: {
        name: plans.name,
      },
    })
    .from(instances)
    .innerJoin(users, eq(instances.userId, users.id))
    .innerJoin(plans, eq(instances.planId, plans.id))
    .where(
      and(
        inArray(instances.status, ["active", "suspended"]),
        gte(instances.expiryDate, now),
        lt(instances.expiryDate, upperBound)
      )
    )

  let sent = 0

  for (const row of rows) {
    if (!row.instance.expiryDate) {
      continue
    }

    const diffMs = row.instance.expiryDate.getTime() - now.getTime()
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    try {
      await sendExpiryReminderEmail({
        to: row.user.email,
        firstName: row.user.firstName,
        instanceId: row.instance.id,
        planName: row.plan.name,
        expiryDate: row.instance.expiryDate,
        daysRemaining,
      })
      sent += 1
    } catch (emailError) {
      console.error("Failed to send expiry reminder email", emailError)
    }
  }

  return {
    sent,
    checked: rows.length,
    daysAhead,
  }
}
