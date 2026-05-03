export function getStartOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

export function getDaysBetween(later: Date, earlier: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24))
}

export function getLatestTimestamp(
  values: Array<Date | string | null | undefined>
): string | null {
  let latest: Date | null = null

  for (const value of values) {
    if (!value) {
      continue
    }

    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
      continue
    }

    if (!latest || date > latest) {
      latest = date
    }
  }

  return latest ? latest.toISOString() : null
}

