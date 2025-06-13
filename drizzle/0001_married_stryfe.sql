CREATE TYPE "public"."program" AS ENUM('IF', 'STI');--> statement-breakpoint
ALTER TABLE "student_records" ADD COLUMN "program" "program" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "program" "program";