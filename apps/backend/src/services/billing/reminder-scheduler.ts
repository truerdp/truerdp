import type { FastifyBaseLogger } from "fastify"
import { sendExpiryReminderSweep } from "./reminders.js"

const MIN_INTERVAL_MINUTES = 5
const DEFAULT_INTERVAL_MINUTES = 0
const DEFAULT_DAYS_AHEAD = 3

function parseIntWithDefault(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function startExpiryReminderScheduler(logger: FastifyBaseLogger) {
  const intervalMinutes = parseIntWithDefault(
    process.env.EXPIRY_REMINDER_SWEEP_INTERVAL_MINUTES,
    DEFAULT_INTERVAL_MINUTES
  )

  if (intervalMinutes <= 0) {
    logger.info(
      "Expiry reminder scheduler disabled (EXPIRY_REMINDER_SWEEP_INTERVAL_MINUTES <= 0)"
    )
    return
  }

  const safeIntervalMinutes = Math.max(intervalMinutes, MIN_INTERVAL_MINUTES)
  const daysAhead = Math.max(
    1,
    Math.min(
      parseIntWithDefault(
        process.env.EXPIRY_REMINDER_SWEEP_DAYS_AHEAD,
        DEFAULT_DAYS_AHEAD
      ),
      30
    )
  )

  const runSweep = async () => {
    try {
      const result = await sendExpiryReminderSweep({ daysAhead })
      logger.info(
        {
          sent: result.sent,
          checked: result.checked,
          daysAhead: result.daysAhead,
        },
        "Expiry reminder sweep completed"
      )
    } catch (error) {
      logger.error(error, "Expiry reminder sweep failed")
    }
  }

  void runSweep()

  const intervalMs = safeIntervalMinutes * 60 * 1000
  setInterval(() => {
    void runSweep()
  }, intervalMs)

  logger.info(
    {
      intervalMinutes: safeIntervalMinutes,
      daysAhead,
    },
    "Expiry reminder scheduler enabled"
  )
}
