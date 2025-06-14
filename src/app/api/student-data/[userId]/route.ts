import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStudentData } from "@/actions/get-user-data";
import db from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const usernameCookie = cookieStore.get("username");

    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!usernameCookie) {
      return NextResponse.json({ error: "Username not found" }, { status: 401 });
    }

    const currentUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, usernameCookie.value))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const targetUserId = parseInt(resolvedParams.userId);
    
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (currentUser[0].role === "students") {
      if (currentUser[0].id !== targetUserId) {
        return NextResponse.json(
          { error: "Students can only access their own transcript" },
          { status: 403 }
        );
      }
    } else if (currentUser[0].role === "advisors") {
      console.log(`Advisor ${currentUser[0].id} accessing student ${targetUserId}`);
    } else if (currentUser[0].role === "head") {
      console.log(`Head ${currentUser[0].id} accessing student ${targetUserId}`);
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

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

    let encryptionKey: string;
    
    if (currentUser[0].role === "students") {
      if (!currentUser[0].encryptionKey) {
        return NextResponse.json(
          { error: "Student encryption key not found" },
          { status: 404 }
        );
      }
      encryptionKey = currentUser[0].encryptionKey;
    } else if (currentUser[0].role === "head" || currentUser[0].role === "advisors") {
      // Both heads and advisors use the target student's encryption key
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

    try {
      const data = await getStudentData(targetUserId, encryptionKey);
      return NextResponse.json(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Student record does not equal to 1")) {
        console.log(`No student data found for user ${targetUserId}, returning placeholder data`);
        
        const placeholderData = {
          studentRecord: {
            userId: targetUserId,
            nim: "00000000",
            program: "Unknown",
            fullName: targetUser[0].username,
            gpa: "0.00",
          },
          grades: [],
          verified: false,
          publicKey: "",
        };
        
        return NextResponse.json(placeholderData);
      }
      
      throw error;
    }

  } catch (error) {
    console.error("Failed to fetch student data:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
