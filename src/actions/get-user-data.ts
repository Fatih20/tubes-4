import db from "@/db";
import { getUserById } from "./upload-user-data";
import {
  studentGradesTable,
  studentRecordsTable,
  usersTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { decryptString } from "@/lib/crypto/rc4";
import { keyFromPEM, RSAPublicKey } from "@/lib/crypto/rsa";
import {
  SignedRecord,
  verifySignedRecord,
} from "@/lib/crypto/digitalSignature";

// the caller of this function should ensure how do they obtain the key
// if student or head, just take the key. otherwise take it from advisor_student_requests

export const getStudentData = async (userId: number, encryptionKey: string) => {
  const student = await getUserById(userId);

  if (student === null) {
    throw new Error("Student ID not found");
  }

  const studentRecord = await db
    .select()
    .from(studentRecordsTable)
    .where(eq(studentRecordsTable.userId, userId));

  if (studentRecord.length !== 1) {
    throw new Error("Student record does not equal to 1");
  }

  const encryptRecord = studentRecord[0];

  if (encryptRecord.digitalSignature === null) {
    throw new Error("Digital signature is empty");
  }

  const grades = await db
    .select()
    .from(studentGradesTable)
    .where(eq(studentGradesTable.userId, userId));

  // try to decrypt the data
  const decryptRecord = {
    userId: userId,
    nim: decryptString(encryptRecord.nim, encryptionKey),
    program: decryptString(encryptRecord.program, encryptionKey),
    fullName: decryptString(encryptRecord.fullName, encryptionKey),
    gpa: decryptString(encryptRecord.gpa, encryptionKey),
  };

  const decryptGrades = grades.map((grade) => {
    return {
      userId: grade.userId,
      courseCode: grade.courseCode,
      grade: decryptString(grade.grade, encryptionKey),
    };
  });

  const signatureRecord: Record<string, string | number> = {
    userId: userId,
    program: decryptRecord.program,
    nim: decryptRecord.nim,
    fullName: decryptRecord.fullName,
    gpa: decryptRecord.gpa,
  };

  for (const grade of decryptGrades) {
    signatureRecord[`grade-${grade.courseCode}`] = grade.grade;
  }

  console.log(decryptRecord);

  const programHead = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.role, "head"),
        eq(usersTable.program, decryptRecord.program as "IF" | "STI")
      )
    )
    .limit(1);

  if (!programHead.length || !programHead[0].privateKey) {
    throw new Error(
      `Could not find program head or head's private key for program: ${decryptRecord.program}`
    );
  }

  const headPublicKey = keyFromPEM(programHead[0].publicKey) as RSAPublicKey;

  const signature = JSON.parse(encryptRecord.digitalSignature) as Omit<
    SignedRecord,
    "record"
  >;

  const verified = verifySignedRecord(
    {
      ...signature,
      record: signatureRecord,
    },
    headPublicKey
  );

  return {
    studentRecord: decryptRecord,
    grades: decryptGrades,
    verified,
    publicKey: programHead[0].publicKey, // just in case for validation in client
  };
};
