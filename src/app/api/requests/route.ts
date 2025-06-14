import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { seeRequest } from "@/actions/see-request";
import db from "@/db";
import { usersTable } from "@/db/schema";
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

    // Only advisors can see requests
    if (currentUser[0].role !== "advisors") {
      return NextResponse.json(
        { error: "Only advisors can view requests" },
        { status: 403 }
      );
    }

    const result = await seeRequest(currentUser[0].id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in see requests route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
