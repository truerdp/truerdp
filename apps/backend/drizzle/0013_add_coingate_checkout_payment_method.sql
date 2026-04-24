DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_method'
      AND e.enumlabel = 'coingate_checkout'
  ) THEN
    -- value already exists; keep migration idempotent
    NULL;
  ELSE
    ALTER TYPE "payment_method" ADD VALUE 'coingate_checkout';
  END IF;
END $$;
