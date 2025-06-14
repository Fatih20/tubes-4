// todo
// act as another advisor who approve access request for student id and advisor id
// add its shares to the array row
// also set advisorApproved to true if the user is the advisor for that student

import db from "@/db";
import {
  advisorStudentRequestsTable,
  studentRecordsTable,
  usersTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const approveAccess = async (studentId: number, advisorId: number) => {
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

  // Get the advisor's shared key for this student
  const sharedKeys = advisor[0].studentSharedKeys as {
    user_id: number;
    shared_key: string;
  }[];

  const sharedKeyForStudent = sharedKeys.find(
    (key) => key.user_id === studentId
  );

  if (!sharedKeyForStudent) {
    throw new Error("Advisor does not have a shared key for this student");
  }

  // Get existing request
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

  if (!existingRequest.length) {
    throw new Error("No access request found for this student-advisor pair");
  }

  // Update the request with the new share and set advisorApproved if applicable
  const currentKeys =
    (existingRequest[0].collectedKeys as {
      user_id: number;
      shared_key: string;
    }[]) || [];

  // Check if this advisor's share is already in the collected keys
  const shareExists = currentKeys.some((key) => key.user_id === advisorId);

  if (shareExists) {
    throw new Error("Advisor has already contributed their share");
  }

  await db
    .update(advisorStudentRequestsTable)
    .set({
      collectedKeys: [...currentKeys, sharedKeyForStudent],
      advisorApproved: isAdvisor || existingRequest[0].advisorApproved,
    })
    .where(
      and(
        eq(advisorStudentRequestsTable.studentId, studentId),
        eq(advisorStudentRequestsTable.advisorId, advisorId)
      )
    );

  return {
    success: true,
    isAdvisor,
  };
};
