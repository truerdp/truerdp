export function getErrorMessage(error: unknown, fallback = "Invalid request") {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
