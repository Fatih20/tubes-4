import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db";
import { courseTable } from "@/db/schema";

export async function GET() {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all courses from the database
    const courses = await db
      .select({
        code: courseTable.code,
        name: courseTable.name,
        credits: courseTable.credits,
      })
      .from(courseTable);

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
