import { z } from "zod";
import db from "@/db";
import {
  usersTable,
  studentRecordsTable,
  studentGradesTable,
  program,
  User,
  courseTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { keyFromPEM, RSAPrivateKey } from "@/lib/crypto/rsa";
import { createSignedRecord } from "@/lib/crypto/digitalSignature";
import { encryptString } from "@/lib/crypto/rc4";

export const userDataSchema = z.object({
  userId: z.number().int(),
  nim: z.string().min(1),
  program: z.enum(program.enumValues),
  fullName: z.string().min(1),
});

export const gradeSchema = z.object({
  courseCode: z.string().min(1),
  grade: z.number().min(1).max(4),
});

export const inputSchema = z.object({
  userData: userDataSchema,
  grades: z.array(gradeSchema),
});

export type UserDataInput = z.infer<typeof inputSchema>;

export const getUserById = async (userId: number): Promise<User | null> => {
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    return user || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);

    return null;
  }
};

/**
 * Inserts a new student and their grades, encrypts their data,
 * and creates a digital signature for their record.
 * @param advisorId - The ID of the advisor uploading the data.
 * @param input - The student's data and grades.
 */
export const uploadStudentData = async (
  advisorId: number,
  input: UserDataInput
) => {
  const validationResult = inputSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(`Invalid input data: ${validationResult.error.message}`);
  }

  const student = await getUserById(input.userData.userId);

  if (student === null) {
    throw new Error("Student ID not found");
  }

  const userKey = student.encryptionKey;

  if (!userKey) {
    throw new Error("Encryption key for student not found");
  }

  const advisor = await getUserById(advisorId);

  if (advisor === null || advisor.role !== "advisors") {
    throw new Error("Advisor ID not found or not an advisor");
  }

  const courses = await db.select().from(courseTable);

  const { userData, grades } = validationResult.data;

  const signatureRecord: Record<string, string | number> = {
    ...userData,
  };

  let totalGrade = 0;
  let totalCredit = 0;

  for (const grade of grades) {
    signatureRecord[`grade-${grade.courseCode}`] = String(grade.grade);

    const course = courses.find((c) => c.code === grade.courseCode);

    if (!course) {
      throw new Error("Course not found");
    }

    totalGrade += course.credits * grade.grade;
    totalCredit += course.credits;
  }

  const gpa = String(
    totalCredit === 0 ? 0 : Math.round((totalGrade * 100) / totalCredit) / 100
  );

  signatureRecord["gpa"] = gpa;

  const programHead = await db
    .select()
    .from(usersTable)
    .where(
      and(eq(usersTable.role, "head"), eq(usersTable.program, userData.program))
    )
    .limit(1);

  if (!programHead.length || !programHead[0].privateKey) {
    throw new Error(
      `Could not find program head or head's private key for program: ${userData.program}`
    );
  }

  const headPrivateKey = keyFromPEM(programHead[0].privateKey) as RSAPrivateKey;

  const { ...signature } = createSignedRecord(signatureRecord, headPrivateKey);

  const signatureString = JSON.stringify(signature);

  await db.insert(studentRecordsTable).values({
    userId: input.userData.userId,
    nim: encryptString(input.userData.nim, userKey),
    program: encryptString(input.userData.program, userKey),
    fullName: encryptString(input.userData.fullName, userKey),
    gpa: encryptString(gpa, userKey),
    digitalSignature: signatureString,
    advisorId: advisorId,
  });

  if (grades.length > 0) {
    const encryptedGrades = await Promise.all(
      grades.map(async (grade) => ({
        userId: input.userData.userId,
        courseCode: grade.courseCode,
        grade: encryptString(grade.grade.toString(), userKey),
      }))
    );
    await db.insert(studentGradesTable).values(encryptedGrades);
  }

  return;
};
