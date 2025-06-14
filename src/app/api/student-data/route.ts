import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db";
import { usersTable, studentRecordsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { inputSchema, uploadStudentData } from "@/actions/upload-user-data";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const usernameCookie = cookieStore.get("username");

    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!usernameCookie) {
      return NextResponse.json(
        { error: "Username not found in session" },
        { status: 401 }
      );
    }

    const currentUserArr = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, usernameCookie.value))
      .limit(1);

    if (currentUserArr.length === 0) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 401 }
      );
    }

    const currentUser = currentUserArr[0];

    if (currentUser.role !== "advisors") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only advisors are permitted to add student records.",
        },
        { status: 403 }
      );
    }

    const advisorId = currentUser.id;

    const body = await req.json();

    const validationResult = inputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data.userData;

    const existingRecord = await db.query.studentRecordsTable.findFirst({
      where: eq(studentRecordsTable.userId, userId),
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: "A student record for this user already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    await uploadStudentData(advisorId, validationResult.data);

    return NextResponse.json(
      { message: "Student record added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding student record:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
