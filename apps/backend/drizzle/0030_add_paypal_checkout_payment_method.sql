DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_method'
      AND e.enumlabel = 'paypal_checkout'
  ) THEN
    ALTER TYPE "payment_method" ADD VALUE 'paypal_checkout';
  END IF;
END $$;
