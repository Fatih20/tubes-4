import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStudentData } from "@/actions/get-user-data";
import db from "@/db";
import { usersTable, studentRecordsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await the params object
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const usernameCookie = cookieStore.get("username");

    // Check authentication
    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!usernameCookie) {
      return NextResponse.json({ error: "Username not found" }, { status: 401 });
    }

    // Get current authenticated user
    const currentUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, usernameCookie.value))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Parse and validate target user ID
    const targetUserId = parseInt(resolvedParams.userId);
    
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Verify target user exists and is a student
    const targetUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetUser[0].role !== "students") {
      return NextResponse.json(
        { error: "Target user is not a student" },
        { status: 400 }
      );
    }

    // Role-based access control
    if (currentUser[0].role === "students") {
      // Students can only access their own data
      if (currentUser[0].id !== targetUserId) {
        return NextResponse.json(
          { error: "Students can only access their own transcript" },
          { status: 403 }
        );
      }
    } else if (currentUser[0].role === "head") {
      // Heads can access any student in their program
      if (!currentUser[0].program) {
        return NextResponse.json(
          { error: "Program head must have a program assigned" },
          { status: 400 }
        );
      }

      // Check if the target student is in the same program as the head
      const studentRecord = await db
        .select()
        .from(studentRecordsTable)
        .where(eq(studentRecordsTable.userId, targetUserId))
        .limit(1);

      if (studentRecord.length > 0) {
        // If student has records, check if they're in the same program
        const studentProgram = studentRecord[0].program;
        if (studentProgram !== currentUser[0].program) {
          return NextResponse.json(
            { error: "You can only access students in your program" },
            { status: 403 }
          );
        }
      }
      // If no student records yet, allow access (they might be a new student)
    } else if (currentUser[0].role === "advisors") {
      // TODO: Implement advisor-student relationship check or SSSS group access
      // For now, allow access for development
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

    // Determine encryption key based on user role
    let encryptionKey: string;
    
    if (currentUser[0].role === "students") {
      // Students use their own encryption key
      if (!currentUser[0].encryptionKey) {
        return NextResponse.json(
          { error: "Student encryption key not found" },
          { status: 404 }
        );
      }
      encryptionKey = currentUser[0].encryptionKey;
    } else if (currentUser[0].role === "head") {
      // Program heads use their own encryption key to decrypt student data
      if (!currentUser[0].encryptionKey) {
        return NextResponse.json(
          { error: "Head encryption key not found" },
          { status: 404 }
        );
      }
      encryptionKey = currentUser[0].encryptionKey;
    } else if (currentUser[0].role === "advisors") {
      // TODO: Implement SSSS key reconstruction for group access
      // For now, use the target student's encryption key
      if (!targetUser[0].encryptionKey) {
        return NextResponse.json(
          { error: "Student encryption key not found" },
          { status: 404 }
        );
      }
      encryptionKey = targetUser[0].encryptionKey;
    } else {
      return NextResponse.json(
        { error: "Cannot determine encryption key for this role" },
        { status: 500 }
      );
    }

    // Attempt to get student academic data
    try {
      const data = await getStudentData(targetUserId, encryptionKey);
      return NextResponse.json(data);
    } catch (error) {
      // Handle case where student has no academic records yet
      if (error instanceof Error && error.message.includes("Student record does not equal to 1")) {
        // Return empty transcript structure for students with no records
        const emptyTranscriptData = {
          studentRecord: {
            userId: targetUserId,
            nim: "Not Available",
            program: currentUser[0].program || "Unknown", // Use head's program as default
            fullName: targetUser[0].username,
            gpa: "0.00",
          },
          grades: [],
          verified: false,
          publicKey: "",
        };
        
        return NextResponse.json(emptyTranscriptData);
      }
      
      // Re-throw other errors
      throw error;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}