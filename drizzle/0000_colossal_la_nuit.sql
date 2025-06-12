CREATE TYPE "public"."users_role" AS ENUM('students', 'advisors', 'head');--> statement-breakpoint
CREATE TABLE "advisor_student_requests" (
	"studentId" integer NOT NULL,
	"advisorId" integer NOT NULL,
	"advisorApproved" boolean DEFAULT false,
	"collectedKeys" jsonb,
	CONSTRAINT "advisor_student_requests_studentId_advisorId_pk" PRIMARY KEY("studentId","advisorId")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_grades" (
	"userId" integer NOT NULL,
	"courseCode" text NOT NULL,
	"grade" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_grades_userId_courseCode_pk" PRIMARY KEY("userId","courseCode")
);
--> statement-breakpoint
CREATE TABLE "student_records" (
	"userId" integer PRIMARY KEY NOT NULL,
	"nim" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"fullName" text NOT NULL,
	"gpa" real NOT NULL,
	"digitalSignature" text,
	"advisorId" integer,
	CONSTRAINT "student_records_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "users_role" DEFAULT 'students' NOT NULL,
	"encryptionKey" text,
	"studentSharedKeys" jsonb,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advisor_student_requests" ADD CONSTRAINT "advisor_student_requests_studentId_users_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_student_requests" ADD CONSTRAINT "advisor_student_requests_advisorId_users_id_fk" FOREIGN KEY ("advisorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_courseCode_courses_code_fk" FOREIGN KEY ("courseCode") REFERENCES "public"."courses"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_records" ADD CONSTRAINT "student_records_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_records" ADD CONSTRAINT "student_records_advisorId_users_id_fk" FOREIGN KEY ("advisorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;