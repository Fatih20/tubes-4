import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const usernameCookie = cookieStore.get("username");

  if (!sessionCookie || sessionCookie.value !== "authenticated") {
    // If the main session is not valid, don't return user info
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!usernameCookie) {
    // This case should ideally not happen if login sets it correctly
    return NextResponse.json({ error: "Username not found" }, { status: 404 });
  }

  try {
    // Get the full user information from the database
    const user = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.username, usernameCookie.value))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
