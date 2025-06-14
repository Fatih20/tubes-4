import "dotenv/config";
import db from "./index"; // Your configured Drizzle DB instance
import { usersTable } from "./schema";
import { eq } from "drizzle-orm";
import { split } from "@/lib/crypto/shamir"; // Assuming this is your actual import

export const threshold = 3;

/**
 * Converts a hexadecimal string to a Uint8Array.
 * @param hex The hexadecimal string to convert.
 * @returns The resulting Uint8Array.
 */
function hexToUint8Array(hex: string): Uint8Array {
  return Buffer.from(hex, "hex");
}

/**
 * Converts a Uint8Array to a hexadecimal string.
 * @param bytes The Uint8Array to convert.
 * @returns The resulting hexadecimal string.
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/**
 * Main function to distribute student encryption key shares to advisors.
 */
async function distributeKeys() {
  console.log("🚀 Starting key distribution process...");

  try {
    // 1. Fetch all students and advisors from the database
    console.log("🔍 Fetching students and advisors...");
    const students = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "students"));
    const advisors = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "advisors"));

    if (students.length === 0 || advisors.length === 0) {
      console.warn("⚠️ No students or advisors found. Exiting.");
      return;
    }

    const sharesCount = advisors.length; // Total shares equal to the number of advisors

    if (sharesCount < threshold) {
      console.error(
        `❌ Error: Number of advisors (${sharesCount}) is less than the required threshold (${threshold}).`
      );
      process.exit(1);
    }

    console.log(
      `✅ Found ${students.length} students and ${advisors.length} advisors.`
    );

    // Create a map to accumulate the shares for each advisor before updating the DB
    const advisorSharesMap = new Map<
      number,
      { student_id: number; share: string }[]
    >();
    advisors.forEach((advisor) => advisorSharesMap.set(advisor.id, []));

    // 2. Iterate over each student to split their key and assign shares
    for (const student of students) {
      if (!student.encryptionKey) {
        console.warn(
          `Skipping student ${student.username} (ID: ${student.id}): no encryption key found.`
        );
        continue;
      }

      console.log(
        `Processing and splitting key for student: ${student.username}...`
      );

      // 3. Split the student's encryption key into shares
      const secretBytes = hexToUint8Array(student.encryptionKey);
      const shares = await split(secretBytes, sharesCount, threshold);

      // 4. Distribute each share to the corresponding advisor's list in the map
      advisors.forEach((advisor, index) => {
        const shareHex = uint8ArrayToHex(shares[index]);
        const shareForAdvisor = {
          student_id: student.id, // The ID of the student this share belongs to
          share: shareHex, // The secret share itself
        };
        // Append the new share to the list for this advisor
        advisorSharesMap.get(advisor.id)?.push(shareForAdvisor);
      });
    }

    // 5. Update each advisor's record with their collected array of shares
    console.log("📨 Updating advisor records with their assigned shares...");
    for (const [advisorId, sharedKeys] of advisorSharesMap.entries()) {
      await db
        .update(usersTable)
        .set({ studentSharedKeys: sharedKeys })
        .where(eq(usersTable.id, advisorId));

      console.log(
        `✔️ Successfully stored ${sharedKeys.length} student key shares for advisor ID: ${advisorId}.`
      );
    }

    console.log("🎉 Key distribution process completed successfully.");
  } catch (error) {
    console.error(
      "An error occurred during the key distribution process:",
      error
    );
    process.exit(1);
  } finally {
    // Ensure the script exits after completion or error
    process.exit(0);
  }
}

// Execute the main function
distributeKeys();
