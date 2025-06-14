import db from "@/db";
import { advisorStudentRequestsTable, usersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const checkApproval = async (studentId: number, advisorId: number) => {
  // Verify that both student and advisor exist
  const [student, advisor] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, studentId)).limit(1),
    db.select().from(usersTable).where(eq(usersTable.id, advisorId)).limit(1),
  ]);

  if (!student.length || !advisor.length) {
    throw new Error("Student or advisor not found");
  }

  // Get the request
  const request = await db
    .select()
    .from(advisorStudentRequestsTable)
    .where(
      and(
        eq(advisorStudentRequestsTable.studentId, studentId),
        eq(advisorStudentRequestsTable.advisorId, advisorId)
      )
    )
    .limit(1);

  if (!request.length) {
    throw new Error("No access request found for this student-advisor pair");
  }

  const currentRequest = request[0];
  const collectedKeys = currentRequest.collectedKeys as {
    user_id: number;
    shared_key: string;
  }[];

  // If the request is approved, return the student data
  if (currentRequest.advisorApproved) {
    return {
      approved: true,
      studentData: student[0],
    };
  }

  // If not approved, return the count of approvers
  return {
    approved: false,
    approverCount: collectedKeys.length,
  };
};
