ALTER TYPE "ticket_status" ADD VALUE IF NOT EXISTS 'answered';
ALTER TYPE "ticket_status" ADD VALUE IF NOT EXISTS 'customer_replied';

ALTER TABLE "users" ADD COLUMN "date_of_birth" text;
