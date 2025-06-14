import { NextResponse } from "next/server";
import { seeRequest } from "@/actions/see-request";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only advisors can see requests
    if (session.user.role !== "advisors") {
      return NextResponse.json(
        { error: "Only advisors can view requests" },
        { status: 403 }
      );
    }

    const result = await seeRequest(session.user.id);

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
