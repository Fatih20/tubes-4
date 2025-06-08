ALTER TABLE "secrets" RENAME TO "student_advisors";--> statement-breakpoint
ALTER TABLE "student_advisors" DROP CONSTRAINT "secrets_advisorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "student_advisors" DROP CONSTRAINT "secrets_studentId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_advisorId_users_id_fk" FOREIGN KEY ("advisorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_advisors" DROP COLUMN "key";