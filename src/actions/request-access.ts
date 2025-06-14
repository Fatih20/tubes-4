// todo
// called by advisor
// create a row to advisorStudentRequestsTable with student id of the student and advisor id of the advisor caller id.
// set advisor approved if the user is the advisor of the student
// add its share to collectedKeys. insert as json or something

import db from "@/db";
import {
  advisorStudentRequestsTable,
  studentRecordsTable,
  usersTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const requestAccess = async (studentId: number, advisorId: number) => {
  // Verify that both student and advisor exist
  const [student, advisor] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, studentId)).limit(1),
    db.select().from(usersTable).where(eq(usersTable.id, advisorId)).limit(1),
  ]);

  if (!student.length || !advisor.length) {
    throw new Error("Student or advisor not found");
  }

  // Check if advisor is actually the student's advisor
  const studentRecord = await db
    .select()
    .from(studentRecordsTable)
    .where(eq(studentRecordsTable.userId, studentId))
    .limit(1);

  if (!studentRecord.length) {
    throw new Error("Student record not found");
  }

  const isAdvisor = studentRecord[0].advisorId === advisorId;

  const sharedKeys = advisor[0].studentSharedKeys as {
    user_id: number;
    shared_key: string;
  }[];

  const sharedKeyForStudent = sharedKeys.find(
    (key) => key.user_id === studentId
  );

  // Check if request already exists
  const existingRequest = await db
    .select()
    .from(advisorStudentRequestsTable)
    .where(
      and(
        eq(advisorStudentRequestsTable.studentId, studentId),
        eq(advisorStudentRequestsTable.advisorId, advisorId)
      )
    )
    .limit(1);

  if (existingRequest.length === 0) {
    // Insert new request
    await db.insert(advisorStudentRequestsTable).values({
      studentId,
      advisorId,
      advisorApproved: isAdvisor,
      collectedKeys: [sharedKeyForStudent],
    });
  } else {
    // Update existing request
    const currentKeys =
      (existingRequest[0].collectedKeys as {
        user_id: number;
        shared_key: string;
      }[]) || [];
    await db
      .update(advisorStudentRequestsTable)
      .set({
        collectedKeys: [...currentKeys, sharedKeyForStudent],
      })
      .where(
        and(
          eq(advisorStudentRequestsTable.studentId, studentId),
          eq(advisorStudentRequestsTable.advisorId, advisorId)
        )
      );
  }

  return {
    success: true,
    isAdvisor,
  };
};
