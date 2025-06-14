"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Request {
  studentId: number;
}

const fetchRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/api/requests`);
  if (!response.ok) {
    throw new Error("Failed to fetch requests");
  }
  return response.json();
};

const approveRequest = async (studentId: number, advisorId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/access-requests/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studentId, advisorId }),
  });

  if (!response.ok) {
    throw new Error("Failed to approve request");
  }

  const data = await response.json();
  console.log(data);
  return data;
};

export default function RequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, isLoadingCurrentUser } = useCurrentUser();

  // Redirect if not an advisor
  useEffect(() => {
    if (!isLoadingCurrentUser && currentUser?.role !== "advisors") {
      router.push("/");
    }
  }, [currentUser, isLoadingCurrentUser, router]);

  const {
    data: requests,
    isLoading: isLoadingRequests,
    error: requestsError,
  } = useQuery<Request[]>({
    queryKey: ["requests"],
    queryFn: fetchRequests,
    enabled: currentUser?.role === "advisors",
  });

  if (isLoadingCurrentUser || isLoadingRequests) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (requestsError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
        <div className="text-white text-xl">Error loading requests</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Pending Requests</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Back to Home
          </button>
        </div>

        {requests && requests.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.studentId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-gray-800">
                      Student ID: {request.studentId}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          if (!currentUser?.id) {
                            throw new Error("Advisor ID not found");
                          }
                          await approveRequest(
                            request.studentId,
                            currentUser.id
                          );
                          // Refetch the requests after approval
                          queryClient.invalidateQueries({
                            queryKey: ["requests"],
                          });
                        } catch (error) {
                          console.error("Error approving request:", error);
                        }
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement approve/reject functionality
                        console.log(
                          "Handle request for student:",
                          request.studentId
                        );
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-600">
            No pending requests
          </div>
        )}
      </div>
    </div>
  );
}
