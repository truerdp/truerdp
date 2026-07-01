import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."home_page"
      ADD COLUMN IF NOT EXISTS "offer_marquee_message" varchar;

    ALTER TABLE "payload"."_home_page_v"
      ADD COLUMN IF NOT EXISTS "version_offer_marquee_message" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."home_page"
      DROP COLUMN IF EXISTS "offer_marquee_message";

    ALTER TABLE "payload"."_home_page_v"
      DROP COLUMN IF EXISTS "version_offer_marquee_message";
  `)
}
