"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface RequestAccessPageProps {
  params: {
    id: string;
  };
}

interface ApprovalStatus {
  approved: boolean;
  studentData?: {
    id: number;
    username: string;
    fullName: string | null;
    nim: string | null;
  };
  approverCount?: number;
}

export default function RequestAccessPage({ params }: RequestAccessPageProps) {
  const router = useRouter();

  const { currentUser } = useCurrentUser();
  const { data: approvalStatus, isLoading: isLoadingStatus } =
    useQuery<ApprovalStatus>({
      queryKey: ["approvalStatus", params.id, currentUser?.id],
      queryFn: async () => {
        if (!currentUser?.id) throw new Error("User ID not found");
        const response = await fetch(
          `${API_BASE_URL}/api/access-requests/check?studentId=${params.id}&advisorId=${currentUser?.id}`
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
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          Access granted! You can now view the student&apos;s record.
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
