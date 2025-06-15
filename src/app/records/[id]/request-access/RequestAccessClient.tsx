"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface RequestAccessClientProps {
  studentId: string;
}

interface ApprovalStatus {
  approved: boolean;
  studentData?: {
    studentRecord: {
      userId: number;
      nim: string;
      program: string;
      fullName: string;
      gpa: string;
    };
    grades: Array<{
      userId: number;
      courseCode: string;
      grade: string;
    }>;
    verified: boolean;
    publicKey: string;
  };
  approverCount?: number;
}

export default function RequestAccessClient({
  studentId,
}: RequestAccessClientProps) {
  const router = useRouter();

  const { currentUser } = useCurrentUser();
  const { data: approvalStatus, isLoading: isLoadingStatus } =
    useQuery<ApprovalStatus>({
      queryKey: ["approvalStatus", studentId, currentUser?.id],
      queryFn: async () => {
        if (!currentUser?.id) throw new Error("User ID not found");
        const response = await fetch(
          `${API_BASE_URL}/api/access-requests/check?studentId=${studentId}&advisorId=${currentUser?.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch approval status");
        }
        const data = await response.json();
        return data;
      },
      enabled: !!currentUser?.id,
      refetchInterval: 5000, // Poll every 5 seconds
    });

  const renderStatus = () => {
    if (isLoadingStatus) {
      return (
        <div className="mb-4 p-4 bg-gray-50 text-gray-700 rounded-md">
          Checking approval status...
        </div>
      );
    }

    if (approvalStatus?.approved) {
      return (
        <div className="space-y-4">
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            Access granted! You can now view the student&apos;s record.
          </div>
          {approvalStatus.studentData && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-gray-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Student Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">
                      {approvalStatus.studentData.studentRecord.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NIM:</span>
                    <span className="font-medium">
                      {approvalStatus.studentData.studentRecord.nim}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Program:</span>
                    <span className="font-medium">
                      {approvalStatus.studentData.studentRecord.program}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GPA:</span>
                    <span className="font-medium">
                      {approvalStatus.studentData.studentRecord.gpa}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Grades
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvalStatus.studentData.grades.map((grade, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {grade.courseCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {grade.grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {approvalStatus.studentData.verified && (
                <div className="bg-green-50 p-4 rounded-md text-green-700">
                  ✓ This record has been verified
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (approvalStatus?.approverCount !== undefined) {
      return (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          Waiting for approval. Current approvers:{" "}
          {approvalStatus.approverCount}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Request Status
          </h2>
          <p className="text-gray-600 mb-8">
            Your request to access this student&apos;s academic record is being
            processed.
          </p>

          {renderStatus()}

          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="w-full py-2 px-4 rounded-md text-gray-700 font-medium bg-gray-100 hover:bg-gray-200"
            >
              {approvalStatus?.approved ? "View Record" : "Back to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
