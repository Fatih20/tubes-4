// TODO
// Check all of the requests for a student that has been made and has not been approved by the advisor that calls this.

import db from "@/db/index";
import { advisorStudentRequestsTable } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";

export async function seeRequest(advisorId: number) {
  try {
    const requests = await db
      .select({
        studentId: advisorStudentRequestsTable.studentId,
        approverId: advisorStudentRequestsTable.approverId,
      })
      .from(advisorStudentRequestsTable)
      .where(and(not(eq(advisorStudentRequestsTable.advisorId, advisorId))));

    const filteredRequests = requests
      .filter((request) => !request.approverId?.includes(advisorId))
      .map((request) => ({ studentId: request.studentId }));

    return { success: true, data: filteredRequests };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}
