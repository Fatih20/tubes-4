CREATE TYPE "public"."users_role" AS ENUM('students', 'advisors', 'head');--> statement-breakpoint
CREATE TABLE "courses" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secrets" (
	"advisorId" integer,
	"studentId" integer,
	"key" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_grades" (
	"nim" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"grade" integer NOT NULL,
	"courseCode" text
);
--> statement-breakpoint
CREATE TABLE "student_record_keys" (
	"key" text NOT NULL,
	"studentId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_records" (
	"userId" integer PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"nim" text NOT NULL,
	"fullName" text NOT NULL,
	"gpa" real NOT NULL,
	CONSTRAINT "student_records_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "name" TO "username";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "students" "users_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_advisorId_users_id_fk" FOREIGN KEY ("advisorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_nim_student_records_nim_fk" FOREIGN KEY ("nim") REFERENCES "public"."student_records"("nim") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_courseCode_courses_code_fk" FOREIGN KEY ("courseCode") REFERENCES "public"."courses"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_record_keys" ADD CONSTRAINT "student_record_keys_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_records" ADD CONSTRAINT "student_records_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;