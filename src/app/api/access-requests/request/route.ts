import { requestAccess } from "@/actions/request-access";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { studentId, advisorId } = await request.json();

    if (!studentId || !advisorId) {
      return NextResponse.json(
        { error: "Student ID and Advisor ID are required" },
        { status: 400 }
      );
    }

    const result = await requestAccess(studentId, advisorId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in request access:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
