import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db";
import { usersTable, studentRecordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const usernameCookie = cookieStore.get("username");

    // Check if user is authenticated
    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!usernameCookie) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 401 }
      );
    }

    // Get current user and verify role
    const currentUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, usernameCookie.value))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Check if user is advisor or head
    if (currentUser[0].role !== "advisors" && currentUser[0].role !== "head") {
      return NextResponse.json(
        {
          error:
            "Access denied. Only advisors and heads can access this resource.",
        },
        { status: 403 }
      );
    }

    // Get all students with their records
    const studentsWithRecords = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        nim: studentRecordsTable.nim,
        fullName: studentRecordsTable.fullName,
        gpa: studentRecordsTable.gpa,
        createdAt: studentRecordsTable.createdAt,
        advisorId: studentRecordsTable.advisorId,
      })
      .from(studentRecordsTable)
      .rightJoin(usersTable, eq(studentRecordsTable.userId, usersTable.id))
      .where(eq(usersTable.role, "students"));

    return NextResponse.json(studentsWithRecords);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
