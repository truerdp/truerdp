import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "payload";
  CREATE TYPE "payload"."enum_users_role" AS ENUM('editor', 'admin');
  CREATE TYPE "payload"."enum_legal_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__legal_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_blog_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__blog_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "payload"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "payload"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "payload"."enum_home_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_faq_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__faq_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_legal_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_legal_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__legal_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."blog_authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"bio" varchar,
  	"avatar_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."blog_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."blog_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"cover_image_id" integer,
  	"og_image_id" integer,
  	"body" jsonb,
  	"author_id" integer,
  	"publish_at" timestamp(3) with time zone,
  	"is_featured" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_blog_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."blog_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_categories_id" integer,
  	"blog_tags_id" integer
  );
  
  CREATE TABLE "payload"."_blog_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_cover_image_id" integer,
  	"version_og_image_id" integer,
  	"version_body" jsonb,
  	"version_author_id" integer,
  	"version_publish_at" timestamp(3) with time zone,
  	"version_is_featured" boolean DEFAULT false,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__blog_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_blog_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_categories_id" integer,
  	"blog_tags_id" integer
  );
  
  CREATE TABLE "payload"."email_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"subject_template" varchar NOT NULL,
  	"html_template" varchar NOT NULL,
  	"text_template" varchar,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "payload"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "payload"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "payload"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"legal_pages_id" integer,
  	"blog_authors_id" integer,
  	"blog_categories_id" integer,
  	"blog_tags_id" integer,
  	"blog_posts_id" integer,
  	"email_templates_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_name" varchar DEFAULT 'TrueRDP',
  	"footer_tagline" varchar,
  	"footer_copyright_text" varchar,
  	"footer_status_text" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."blog_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_title" varchar DEFAULT 'TrueRDP Blog' NOT NULL,
  	"hero_description" varchar,
  	"default_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."home_page_value_props" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "payload"."home_page_journey_section_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"details" varchar
  );
  
  CREATE TABLE "payload"."home_page_testimonials_section_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"name" varchar,
  	"role" varchar
  );
  
  CREATE TABLE "payload"."home_page_faq_preview_section_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "payload"."home_page_live_support_section_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "payload"."home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'TrueRDP Plans',
  	"summary" varchar,
  	"hero_badge" varchar,
  	"hero_headline" varchar,
  	"hero_description" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_secondary_cta_label" varchar,
  	"hero_trust_line" varchar,
  	"value_props_section_eyebrow" varchar,
  	"value_props_section_headline" varchar,
  	"journey_section_eyebrow" varchar,
  	"journey_section_headline" varchar,
  	"journey_section_description" varchar,
  	"sections_featured_plans_title" varchar,
  	"sections_featured_plans_description" varchar,
  	"sections_plan_groups_title" varchar,
  	"sections_plan_locations_title" varchar,
  	"sections_comparison_title" varchar,
  	"sections_comparison_description" varchar,
  	"location_section_eyebrow" varchar,
  	"location_section_headline" varchar,
  	"location_section_description" varchar,
  	"location_section_footer_title" varchar,
  	"location_section_footer_description" varchar,
  	"location_section_cta_label" varchar,
  	"testimonials_section_eyebrow" varchar,
  	"testimonials_section_headline" varchar,
  	"testimonials_section_rating_label" varchar,
  	"faq_preview_section_eyebrow" varchar,
  	"faq_preview_section_headline" varchar,
  	"faq_preview_section_description" varchar,
  	"faq_preview_section_cta_label" varchar,
  	"live_support_section_eyebrow" varchar,
  	"live_support_section_headline" varchar,
  	"live_support_section_description" varchar,
  	"final_cta_headline" varchar,
  	"final_cta_description" varchar,
  	"final_cta_primary_cta_label" varchar,
  	"final_cta_secondary_cta_label" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"_status" "payload"."enum_home_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_home_page_v_version_value_props" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_home_page_v_version_journey_section_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"details" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_home_page_v_version_testimonials_section_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"name" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_home_page_v_version_faq_preview_section_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_home_page_v_version_live_support_section_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar DEFAULT 'TrueRDP Plans',
  	"version_summary" varchar,
  	"version_hero_badge" varchar,
  	"version_hero_headline" varchar,
  	"version_hero_description" varchar,
  	"version_hero_primary_cta_label" varchar,
  	"version_hero_secondary_cta_label" varchar,
  	"version_hero_trust_line" varchar,
  	"version_value_props_section_eyebrow" varchar,
  	"version_value_props_section_headline" varchar,
  	"version_journey_section_eyebrow" varchar,
  	"version_journey_section_headline" varchar,
  	"version_journey_section_description" varchar,
  	"version_sections_featured_plans_title" varchar,
  	"version_sections_featured_plans_description" varchar,
  	"version_sections_plan_groups_title" varchar,
  	"version_sections_plan_locations_title" varchar,
  	"version_sections_comparison_title" varchar,
  	"version_sections_comparison_description" varchar,
  	"version_location_section_eyebrow" varchar,
  	"version_location_section_headline" varchar,
  	"version_location_section_description" varchar,
  	"version_location_section_footer_title" varchar,
  	"version_location_section_footer_description" varchar,
  	"version_location_section_cta_label" varchar,
  	"version_testimonials_section_eyebrow" varchar,
  	"version_testimonials_section_headline" varchar,
  	"version_testimonials_section_rating_label" varchar,
  	"version_faq_preview_section_eyebrow" varchar,
  	"version_faq_preview_section_headline" varchar,
  	"version_faq_preview_section_description" varchar,
  	"version_faq_preview_section_cta_label" varchar,
  	"version_live_support_section_eyebrow" varchar,
  	"version_live_support_section_headline" varchar,
  	"version_live_support_section_description" varchar,
  	"version_final_cta_headline" varchar,
  	"version_final_cta_description" varchar,
  	"version_final_cta_primary_cta_label" varchar,
  	"version_final_cta_secondary_cta_label" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version__status" "payload"."enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."faq_page_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "payload"."faq_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Frequently Asked Questions',
  	"summary" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"_status" "payload"."enum_faq_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_faq_page_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_faq_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar DEFAULT 'Frequently Asked Questions',
  	"version_summary" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version__status" "payload"."enum__faq_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_legal_pages_v" ADD CONSTRAINT "_legal_pages_v_parent_id_legal_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."blog_authors" ADD CONSTRAINT "blog_authors_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."blog_posts" ADD CONSTRAINT "blog_posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."blog_posts" ADD CONSTRAINT "blog_posts_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."blog_posts" ADD CONSTRAINT "blog_posts_author_id_blog_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."blog_authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "payload"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "payload"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_parent_id_blog_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."blog_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_og_image_id_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_author_id_blog_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."blog_authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_blog_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "payload"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "payload"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_pages_fk" FOREIGN KEY ("legal_pages_id") REFERENCES "payload"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_authors_fk" FOREIGN KEY ("blog_authors_id") REFERENCES "payload"."blog_authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "payload"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "payload"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "payload"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_templates_fk" FOREIGN KEY ("email_templates_id") REFERENCES "payload"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_header_links" ADD CONSTRAINT "site_settings_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_links" ADD CONSTRAINT "site_settings_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_columns_links" ADD CONSTRAINT "site_settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_columns" ADD CONSTRAINT "site_settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."blog_settings" ADD CONSTRAINT "blog_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page_value_props" ADD CONSTRAINT "home_page_value_props_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_journey_section_steps" ADD CONSTRAINT "home_page_journey_section_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_testimonials_section_items" ADD CONSTRAINT "home_page_testimonials_section_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_faq_preview_section_items" ADD CONSTRAINT "home_page_faq_preview_section_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_live_support_section_topics" ADD CONSTRAINT "home_page_live_support_section_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_value_props" ADD CONSTRAINT "_home_page_v_version_value_props_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_journey_section_steps" ADD CONSTRAINT "_home_page_v_version_journey_section_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_testimonials_section_items" ADD CONSTRAINT "_home_page_v_version_testimonials_section_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_faq_preview_section_items" ADD CONSTRAINT "_home_page_v_version_faq_preview_section_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_home_page_v_version_live_support_section_topics" ADD CONSTRAINT "_home_page_v_version_live_support_section_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."faq_page_items" ADD CONSTRAINT "faq_page_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."faq_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_faq_page_v_version_items" ADD CONSTRAINT "_faq_page_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_faq_page_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE UNIQUE INDEX "legal_pages_slug_idx" ON "payload"."legal_pages" USING btree ("slug");
  CREATE INDEX "legal_pages_updated_at_idx" ON "payload"."legal_pages" USING btree ("updated_at");
  CREATE INDEX "legal_pages_created_at_idx" ON "payload"."legal_pages" USING btree ("created_at");
  CREATE INDEX "legal_pages__status_idx" ON "payload"."legal_pages" USING btree ("_status");
  CREATE INDEX "_legal_pages_v_parent_idx" ON "payload"."_legal_pages_v" USING btree ("parent_id");
  CREATE INDEX "_legal_pages_v_version_version_slug_idx" ON "payload"."_legal_pages_v" USING btree ("version_slug");
  CREATE INDEX "_legal_pages_v_version_version_updated_at_idx" ON "payload"."_legal_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_legal_pages_v_version_version_created_at_idx" ON "payload"."_legal_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_legal_pages_v_version_version__status_idx" ON "payload"."_legal_pages_v" USING btree ("version__status");
  CREATE INDEX "_legal_pages_v_created_at_idx" ON "payload"."_legal_pages_v" USING btree ("created_at");
  CREATE INDEX "_legal_pages_v_updated_at_idx" ON "payload"."_legal_pages_v" USING btree ("updated_at");
  CREATE INDEX "_legal_pages_v_latest_idx" ON "payload"."_legal_pages_v" USING btree ("latest");
  CREATE INDEX "_legal_pages_v_autosave_idx" ON "payload"."_legal_pages_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "blog_authors_slug_idx" ON "payload"."blog_authors" USING btree ("slug");
  CREATE INDEX "blog_authors_avatar_idx" ON "payload"."blog_authors" USING btree ("avatar_id");
  CREATE INDEX "blog_authors_updated_at_idx" ON "payload"."blog_authors" USING btree ("updated_at");
  CREATE INDEX "blog_authors_created_at_idx" ON "payload"."blog_authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_categories_slug_idx" ON "payload"."blog_categories" USING btree ("slug");
  CREATE INDEX "blog_categories_updated_at_idx" ON "payload"."blog_categories" USING btree ("updated_at");
  CREATE INDEX "blog_categories_created_at_idx" ON "payload"."blog_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_tags_slug_idx" ON "payload"."blog_tags" USING btree ("slug");
  CREATE INDEX "blog_tags_updated_at_idx" ON "payload"."blog_tags" USING btree ("updated_at");
  CREATE INDEX "blog_tags_created_at_idx" ON "payload"."blog_tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "payload"."blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_cover_image_idx" ON "payload"."blog_posts" USING btree ("cover_image_id");
  CREATE INDEX "blog_posts_og_image_idx" ON "payload"."blog_posts" USING btree ("og_image_id");
  CREATE INDEX "blog_posts_author_idx" ON "payload"."blog_posts" USING btree ("author_id");
  CREATE INDEX "blog_posts_publish_at_idx" ON "payload"."blog_posts" USING btree ("publish_at");
  CREATE INDEX "blog_posts_is_featured_idx" ON "payload"."blog_posts" USING btree ("is_featured");
  CREATE INDEX "blog_posts_updated_at_idx" ON "payload"."blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "payload"."blog_posts" USING btree ("created_at");
  CREATE INDEX "blog_posts__status_idx" ON "payload"."blog_posts" USING btree ("_status");
  CREATE INDEX "blog_posts_rels_order_idx" ON "payload"."blog_posts_rels" USING btree ("order");
  CREATE INDEX "blog_posts_rels_parent_idx" ON "payload"."blog_posts_rels" USING btree ("parent_id");
  CREATE INDEX "blog_posts_rels_path_idx" ON "payload"."blog_posts_rels" USING btree ("path");
  CREATE INDEX "blog_posts_rels_blog_categories_id_idx" ON "payload"."blog_posts_rels" USING btree ("blog_categories_id");
  CREATE INDEX "blog_posts_rels_blog_tags_id_idx" ON "payload"."blog_posts_rels" USING btree ("blog_tags_id");
  CREATE INDEX "_blog_posts_v_parent_idx" ON "payload"."_blog_posts_v" USING btree ("parent_id");
  CREATE INDEX "_blog_posts_v_version_version_slug_idx" ON "payload"."_blog_posts_v" USING btree ("version_slug");
  CREATE INDEX "_blog_posts_v_version_version_cover_image_idx" ON "payload"."_blog_posts_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_blog_posts_v_version_version_og_image_idx" ON "payload"."_blog_posts_v" USING btree ("version_og_image_id");
  CREATE INDEX "_blog_posts_v_version_version_author_idx" ON "payload"."_blog_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_blog_posts_v_version_version_publish_at_idx" ON "payload"."_blog_posts_v" USING btree ("version_publish_at");
  CREATE INDEX "_blog_posts_v_version_version_is_featured_idx" ON "payload"."_blog_posts_v" USING btree ("version_is_featured");
  CREATE INDEX "_blog_posts_v_version_version_updated_at_idx" ON "payload"."_blog_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_blog_posts_v_version_version_created_at_idx" ON "payload"."_blog_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_blog_posts_v_version_version__status_idx" ON "payload"."_blog_posts_v" USING btree ("version__status");
  CREATE INDEX "_blog_posts_v_created_at_idx" ON "payload"."_blog_posts_v" USING btree ("created_at");
  CREATE INDEX "_blog_posts_v_updated_at_idx" ON "payload"."_blog_posts_v" USING btree ("updated_at");
  CREATE INDEX "_blog_posts_v_latest_idx" ON "payload"."_blog_posts_v" USING btree ("latest");
  CREATE INDEX "_blog_posts_v_autosave_idx" ON "payload"."_blog_posts_v" USING btree ("autosave");
  CREATE INDEX "_blog_posts_v_rels_order_idx" ON "payload"."_blog_posts_v_rels" USING btree ("order");
  CREATE INDEX "_blog_posts_v_rels_parent_idx" ON "payload"."_blog_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_blog_posts_v_rels_path_idx" ON "payload"."_blog_posts_v_rels" USING btree ("path");
  CREATE INDEX "_blog_posts_v_rels_blog_categories_id_idx" ON "payload"."_blog_posts_v_rels" USING btree ("blog_categories_id");
  CREATE INDEX "_blog_posts_v_rels_blog_tags_id_idx" ON "payload"."_blog_posts_v_rels" USING btree ("blog_tags_id");
  CREATE UNIQUE INDEX "email_templates_key_idx" ON "payload"."email_templates" USING btree ("key");
  CREATE INDEX "email_templates_is_active_idx" ON "payload"."email_templates" USING btree ("is_active");
  CREATE INDEX "email_templates_updated_at_idx" ON "payload"."email_templates" USING btree ("updated_at");
  CREATE INDEX "email_templates_created_at_idx" ON "payload"."email_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload"."payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_legal_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("legal_pages_id");
  CREATE INDEX "payload_locked_documents_rels_blog_authors_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("blog_authors_id");
  CREATE INDEX "payload_locked_documents_rels_blog_categories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("blog_categories_id");
  CREATE INDEX "payload_locked_documents_rels_blog_tags_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("blog_tags_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_email_templates_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("email_templates_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_header_links_order_idx" ON "payload"."site_settings_header_links" USING btree ("_order");
  CREATE INDEX "site_settings_header_links_parent_id_idx" ON "payload"."site_settings_header_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_links_order_idx" ON "payload"."site_settings_footer_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_links_parent_id_idx" ON "payload"."site_settings_footer_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_links_order_idx" ON "payload"."site_settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_links_parent_id_idx" ON "payload"."site_settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_order_idx" ON "payload"."site_settings_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_parent_id_idx" ON "payload"."site_settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "blog_settings_default_og_image_idx" ON "payload"."blog_settings" USING btree ("default_og_image_id");
  CREATE INDEX "home_page_value_props_order_idx" ON "payload"."home_page_value_props" USING btree ("_order");
  CREATE INDEX "home_page_value_props_parent_id_idx" ON "payload"."home_page_value_props" USING btree ("_parent_id");
  CREATE INDEX "home_page_journey_section_steps_order_idx" ON "payload"."home_page_journey_section_steps" USING btree ("_order");
  CREATE INDEX "home_page_journey_section_steps_parent_id_idx" ON "payload"."home_page_journey_section_steps" USING btree ("_parent_id");
  CREATE INDEX "home_page_testimonials_section_items_order_idx" ON "payload"."home_page_testimonials_section_items" USING btree ("_order");
  CREATE INDEX "home_page_testimonials_section_items_parent_id_idx" ON "payload"."home_page_testimonials_section_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_faq_preview_section_items_order_idx" ON "payload"."home_page_faq_preview_section_items" USING btree ("_order");
  CREATE INDEX "home_page_faq_preview_section_items_parent_id_idx" ON "payload"."home_page_faq_preview_section_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_live_support_section_topics_order_idx" ON "payload"."home_page_live_support_section_topics" USING btree ("_order");
  CREATE INDEX "home_page_live_support_section_topics_parent_id_idx" ON "payload"."home_page_live_support_section_topics" USING btree ("_parent_id");
  CREATE INDEX "home_page__status_idx" ON "payload"."home_page" USING btree ("_status");
  CREATE INDEX "_home_page_v_version_value_props_order_idx" ON "payload"."_home_page_v_version_value_props" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_value_props_parent_id_idx" ON "payload"."_home_page_v_version_value_props" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_journey_section_steps_order_idx" ON "payload"."_home_page_v_version_journey_section_steps" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_journey_section_steps_parent_id_idx" ON "payload"."_home_page_v_version_journey_section_steps" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_testimonials_section_items_order_idx" ON "payload"."_home_page_v_version_testimonials_section_items" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_testimonials_section_items_parent_id_idx" ON "payload"."_home_page_v_version_testimonials_section_items" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_faq_preview_section_items_order_idx" ON "payload"."_home_page_v_version_faq_preview_section_items" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_faq_preview_section_items_parent_id_idx" ON "payload"."_home_page_v_version_faq_preview_section_items" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_live_support_section_topics_order_idx" ON "payload"."_home_page_v_version_live_support_section_topics" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_live_support_section_topics_parent_id_idx" ON "payload"."_home_page_v_version_live_support_section_topics" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_version__status_idx" ON "payload"."_home_page_v" USING btree ("version__status");
  CREATE INDEX "_home_page_v_created_at_idx" ON "payload"."_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "payload"."_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_latest_idx" ON "payload"."_home_page_v" USING btree ("latest");
  CREATE INDEX "_home_page_v_autosave_idx" ON "payload"."_home_page_v" USING btree ("autosave");
  CREATE INDEX "faq_page_items_order_idx" ON "payload"."faq_page_items" USING btree ("_order");
  CREATE INDEX "faq_page_items_parent_id_idx" ON "payload"."faq_page_items" USING btree ("_parent_id");
  CREATE INDEX "faq_page__status_idx" ON "payload"."faq_page" USING btree ("_status");
  CREATE INDEX "_faq_page_v_version_items_order_idx" ON "payload"."_faq_page_v_version_items" USING btree ("_order");
  CREATE INDEX "_faq_page_v_version_items_parent_id_idx" ON "payload"."_faq_page_v_version_items" USING btree ("_parent_id");
  CREATE INDEX "_faq_page_v_version_version__status_idx" ON "payload"."_faq_page_v" USING btree ("version__status");
  CREATE INDEX "_faq_page_v_created_at_idx" ON "payload"."_faq_page_v" USING btree ("created_at");
  CREATE INDEX "_faq_page_v_updated_at_idx" ON "payload"."_faq_page_v" USING btree ("updated_at");
  CREATE INDEX "_faq_page_v_latest_idx" ON "payload"."_faq_page_v" USING btree ("latest");
  CREATE INDEX "_faq_page_v_autosave_idx" ON "payload"."_faq_page_v" USING btree ("autosave");`)
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."legal_pages" CASCADE;
  DROP TABLE "payload"."_legal_pages_v" CASCADE;
  DROP TABLE "payload"."blog_authors" CASCADE;
  DROP TABLE "payload"."blog_categories" CASCADE;
  DROP TABLE "payload"."blog_tags" CASCADE;
  DROP TABLE "payload"."blog_posts" CASCADE;
  DROP TABLE "payload"."blog_posts_rels" CASCADE;
  DROP TABLE "payload"."_blog_posts_v" CASCADE;
  DROP TABLE "payload"."_blog_posts_v_rels" CASCADE;
  DROP TABLE "payload"."email_templates" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_jobs_log" CASCADE;
  DROP TABLE "payload"."payload_jobs" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."site_settings_header_links" CASCADE;
  DROP TABLE "payload"."site_settings_footer_links" CASCADE;
  DROP TABLE "payload"."site_settings_footer_columns_links" CASCADE;
  DROP TABLE "payload"."site_settings_footer_columns" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;
  DROP TABLE "payload"."blog_settings" CASCADE;
  DROP TABLE "payload"."home_page_value_props" CASCADE;
  DROP TABLE "payload"."home_page_journey_section_steps" CASCADE;
  DROP TABLE "payload"."home_page_testimonials_section_items" CASCADE;
  DROP TABLE "payload"."home_page_faq_preview_section_items" CASCADE;
  DROP TABLE "payload"."home_page_live_support_section_topics" CASCADE;
  DROP TABLE "payload"."home_page" CASCADE;
  DROP TABLE "payload"."_home_page_v_version_value_props" CASCADE;
  DROP TABLE "payload"."_home_page_v_version_journey_section_steps" CASCADE;
  DROP TABLE "payload"."_home_page_v_version_testimonials_section_items" CASCADE;
  DROP TABLE "payload"."_home_page_v_version_faq_preview_section_items" CASCADE;
  DROP TABLE "payload"."_home_page_v_version_live_support_section_topics" CASCADE;
  DROP TABLE "payload"."_home_page_v" CASCADE;
  DROP TABLE "payload"."faq_page_items" CASCADE;
  DROP TABLE "payload"."faq_page" CASCADE;
  DROP TABLE "payload"."_faq_page_v_version_items" CASCADE;
  DROP TABLE "payload"."_faq_page_v" CASCADE;
  DROP TYPE "payload"."enum_users_role";
  DROP TYPE "payload"."enum_legal_pages_status";
  DROP TYPE "payload"."enum__legal_pages_v_version_status";
  DROP TYPE "payload"."enum_blog_posts_status";
  DROP TYPE "payload"."enum__blog_posts_v_version_status";
  DROP TYPE "payload"."enum_payload_jobs_log_task_slug";
  DROP TYPE "payload"."enum_payload_jobs_log_state";
  DROP TYPE "payload"."enum_payload_jobs_task_slug";
  DROP TYPE "payload"."enum_home_page_status";
  DROP TYPE "payload"."enum__home_page_v_version_status";
  DROP TYPE "payload"."enum_faq_page_status";
  DROP TYPE "payload"."enum__faq_page_v_version_status";
  DROP SCHEMA IF EXISTS "payload";`)
}
