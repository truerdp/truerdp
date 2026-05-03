export const EXTERNAL_REFERENCE_PATHS: string[][] = [
  ["reference"],
  ["transactionReference"],
  ["tx_ref"],
  ["data", "reference"],
  ["data", "transactionReference"],
  ["data", "tx_ref"],
  ["metadata", "reference"],
  ["data", "metadata", "reference"],
  ["data", "payment", "metadata", "reference"],
  ["data", "invoice", "metadata", "reference"],
  ["metadata", "transaction_id"],
  ["data", "metadata", "transaction_id"],
  ["data", "payment", "metadata", "transaction_id"],
  ["data", "invoice", "metadata", "transaction_id"],
  ["metadata", "reference_id"],
  ["metadata", "referenceId"],
  ["data", "metadata", "reference_id"],
  ["data", "metadata", "referenceId"],
]

export const TRANSACTION_ID_PATHS: string[][] = [
  ["metadata", "transaction_id"],
  ["data", "metadata", "transaction_id"],
  ["data", "payment", "metadata", "transaction_id"],
  ["data", "invoice", "metadata", "transaction_id"],
]

export const INVOICE_ID_PATHS: string[][] = [
  ["metadata", "invoice_id"],
  ["data", "metadata", "invoice_id"],
  ["data", "payment", "metadata", "invoice_id"],
  ["data", "invoice", "metadata", "invoice_id"],
]
