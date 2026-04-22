DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_method'
      AND e.enumlabel = 'dodo_checkout'
  ) THEN
    ALTER TYPE "payment_method" ADD VALUE 'dodo_checkout';
  END IF;
END $$;
