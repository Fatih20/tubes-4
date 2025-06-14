import { checkApproval } from "@/actions/check-approval";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const advisorId = searchParams.get("advisorId");

    if (!studentId || !advisorId) {
      return NextResponse.json(
        { error: "Student ID and Advisor ID are required" },
        { status: 400 }
      );
    }

    const result = await checkApproval(Number(studentId), Number(advisorId));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in check approval:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
