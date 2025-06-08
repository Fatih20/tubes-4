import {
  integer,
  pgTable,
  varchar,
  text,
  pgEnum,
  timestamp,
  real,
} from "drizzle-orm/pg-core";

export const usersRole = pgEnum("users_role", ["students", "advisors", "head"]);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull(),
  password: text().notNull(),
  role: usersRole("role").notNull().default("students"),
});

export const studentRecordsTable = pgTable("student_records", {
  userId: integer()
    .references(() => usersTable.id)
    .primaryKey(),
  createdAt: timestamp().notNull().defaultNow(),
  nim: text().notNull().unique(),
  fullName: text().notNull(),
  gpa: real().notNull(),
});

export const studentGradesTable = pgTable("student_grades", {
  nim: text()
    .references(() => studentRecordsTable.nim)
    .primaryKey(),
  createdAt: timestamp().notNull().defaultNow(),
  grade: integer().notNull(),
  courseCode: text().references(() => courseTable.code),
});

export const courseTable = pgTable("courses", {
  code: text().primaryKey(),
  name: text().notNull(),
  credits: integer().notNull(),
});

// Should only be used by students in accessing their own records, advisors in accessing their students' records, and headmasters in accessing all records
export const studentRecordKeysTable = pgTable("student_record_keys", {
  key: text().notNull(),
  studentId: integer().references(() => usersTable.id),
  createdAt: timestamp().notNull().defaultNow(),
});

// Used by advisors to access other students' records
export const secretsTable = pgTable("secrets", {
  advisorId: integer().references(() => usersTable.id),
  studentId: integer().references(() => usersTable.id),
  key: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
