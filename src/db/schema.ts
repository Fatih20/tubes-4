import {
  integer,
  pgTable,
  varchar,
  text,
  pgEnum,
  timestamp,
  jsonb,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";

// Enum for user roles
export const usersRole = pgEnum("users_role", ["students", "advisors", "head"]);

export const program = pgEnum("program", ["IF", "STI"]);

// Users table to store authentication and core user information
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull(),
  password: text().notNull(),
  role: usersRole().notNull().default("students"),
  program: program(),
  encryptionKey: text(), // nullable, present for students, filled on registration
  studentSharedKeys: jsonb(), // nullable, array of objects ({user_id, shared_key})
  publicKey: text().notNull(), // generated on registration
  privateKey: text().notNull(), // generated on registration
  createdAt: timestamp().notNull().defaultNow(),
});

// Student records table, linked to the users table
export const studentRecordsTable = pgTable("student_records", {
  userId: integer()
    .references(() => usersTable.id)
    .primaryKey(),
  nim: text().notNull().unique(),
  program: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  fullName: text().notNull(),
  gpa: text().notNull(),
  digitalSignature: text(),
  advisorId: integer().references(() => usersTable.id),
});

// Courses table
export const courseTable = pgTable("courses", {
  code: text().primaryKey(),
  name: text().notNull(),
  credits: integer().notNull(),
});

// Student grades table with a composite primary key
export const studentGradesTable = pgTable(
  "student_grades",
  {
    userId: integer()
      .references(() => usersTable.id)
      .notNull(),
    courseCode: text()
      .references(() => courseTable.code)
      .notNull(),
    grade: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => {
    return {
      // Composite primary key consisting of userId and courseCode
      pk: primaryKey({ columns: [table.userId, table.courseCode] }),
    };
  }
);

// todo student-advisor-keys table
export const advisorStudentRequestsTable = pgTable(
  "advisor_student_requests",
  {
    studentId: integer()
      .references(() => usersTable.id)
      .notNull(),
    advisorId: integer()
      .references(() => usersTable.id)
      .notNull(),
    advisorApproved: boolean().default(false),
    approverId: integer().array(),
    collectedKeys: jsonb(),
  },
  (table) => {
    return {
      // Composite primary key consisting of userId and courseCode
      pk: primaryKey({ columns: [table.studentId, table.advisorId] }),
    };
  }
);

export type User = typeof usersTable.$inferSelect;
