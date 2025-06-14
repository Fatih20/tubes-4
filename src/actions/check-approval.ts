import db from "@/db";
import { advisorStudentRequestsTable, usersTable } from "@/db/schema";
import { threshold } from "@/db/secret-schema";
import { eq, and } from "drizzle-orm";
import { combine } from "@/lib/crypto/shamir";
import { getStudentData } from "./get-user-data";

function hexToUint8Array(hex: string): Uint8Array {
  const buffer = Buffer.from(hex, "hex");
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

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
    student_id: number;
    share: string;
  }[];

  // Check if both conditions are met:
  // 1. The student's advisor has approved
  // 2. We have enough shares to reconstruct the secret (threshold reached)
  const hasEnoughShares = collectedKeys.length >= threshold;
  const isApproved = currentRequest.advisorApproved && hasEnoughShares;

  console.log(collectedKeys);

  if (isApproved) {
    try {
      // Convert the collected shares to Uint8Array format
      const shares = collectedKeys.map((key) => hexToUint8Array(key.share));

      console.log(shares);

      // Reconstruct the secret using Shamir's Secret Sharing
      const reconstructedSecret = await combine(shares);

      // Convert the reconstructed secret back to hex
      const reconstructedKey = uint8ArrayToHex(reconstructedSecret);

      // Get and decrypt the student data using the reconstructed key
      const decryptedData = await getStudentData(studentId, reconstructedKey);

      return {
        approved: true,
        studentData: decryptedData,
      };
    } catch (error) {
      console.error("Error processing student data:", error);
      throw new Error("Failed to process student data");
    }
  }

  // If not approved, return the count of approvers and whether advisor has approved
  return {
    approved: false,
    advisorApproved: currentRequest.advisorApproved,
    approverCount: collectedKeys.length,
    requiredApprovers: threshold,
  };
};
