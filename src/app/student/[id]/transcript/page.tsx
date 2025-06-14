// src/app/student/[id]/transcript/page.tsx
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import StudentDashboard from "@/components/StudentDashboard";
import { API_BASE_URL } from "@/lib/config";

interface User {
  id: number;
  username: string;
  role: string;
  program?: string;
  encryptionKey?: string;
}

interface Student {
  id: number;
  username: string;
  role: string;
  nim: string | null;
  fullName: string | null;
  gpa: string | null;
  createdAt: string | null;
  advisorId?: number;
  program?: string;
  encryptionKey?: string; // Add encryption key to the interface
}

interface FetchError extends Error {
  status?: number;
}

interface ApiErrorResponse {
  status: number;
  error: string;
}

const fetchCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/api/me`);
  if (!response.ok) {
    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch current user: ${response.status} ${errorText}`);
  }
  return response.json();
};

const fetchAllStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${API_BASE_URL}/api/users/students`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch students");
  }
  return response.json();
};

interface StudentTranscriptPageProps {
  params: Promise<{ id: string }>;
}

export default function StudentTranscriptPage({ params }: StudentTranscriptPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Force refresh when component mounts to clear any stale cache
  useEffect(() => {
    // Invalidate relevant queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ["studentData"] });
    queryClient.invalidateQueries({ queryKey: ["allStudents"] });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  }, []); // Run once on mount

  // Resolve params
  const { data: resolvedParams, isLoading: isLoadingParams } = useQuery({
    queryKey: ["params"],
    queryFn: async () => await params,
    retry: false,
  });

  const studentId = resolvedParams ? parseInt(resolvedParams.id) : null;

  const {
    data: currentUserResponse,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
  } = useQuery<User | ApiErrorResponse, FetchError>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 1,
  });

  // Fetch all students to find the target student by ID
  const {
    data: allStudents,
    isLoading: isLoadingStudents,
    error: studentsError,
  } = useQuery<Student[], FetchError>({
    queryKey: ["allStudents"],
    queryFn: fetchAllStudents,
    enabled: !!studentId,
    retry: 1,
  });

  const currentUser = currentUserResponse && !("status" in currentUserResponse) ? (currentUserResponse as User) : undefined;

  // Find the target student from the students list
  const targetStudent = allStudents?.find((student) => student.id === studentId);

  useEffect(() => {
    if (currentUserResponse && "status" in currentUserResponse && currentUserResponse.status === 401) {
      router.push("/login");
    }
  }, [currentUserResponse, router]);

  async function handleLogout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
      });
      if (response.ok) {
        console.log("Logout successful");
      } else {
        console.error("Logout API call failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Error fetching logout API:", error);
    }
    router.push("/login");
  }

  const handleBackToStudents = () => {
    router.push("/");
  };

  if (isLoadingParams || isLoadingCurrentUser || isLoadingStudents) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
        <div className="py-10 text-center">
          <p className="text-white text-xl">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (currentUserError || studentsError || !studentId || isNaN(studentId)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
        <div className="py-10 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Error</h2>
          <p className="text-lg mb-6 text-white">{currentUserError?.message || studentsError?.message || "Invalid student ID"}</p>
          <button
            onClick={handleBackToStudents}
            className="bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
        <div className="py-10 text-center">
          <p className="text-white text-xl">User data not found</p>
        </div>
      </div>
    );
  }

  if (!targetStudent) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
        <div className="py-10 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Student Not Found</h2>
          <p className="text-lg mb-6 text-white">The requested student could not be found.</p>
          <button
            onClick={handleBackToStudents}
            className="bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  // Check permissions - only heads and advisors can view other students' transcripts
  if (currentUser.role === "students" && currentUser.id !== studentId) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
        <div className="py-10 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Access Denied</h2>
          <p className="text-lg mb-6 text-white">Students can only view their own transcript</p>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Create the user object for StudentDashboard with proper structure
  const studentUser: User = {
    id: targetStudent.id,
    username: targetStudent.username,
    role: "students",
    encryptionKey: targetStudent.encryptionKey || currentUser.encryptionKey, // Use target student's encryption key
  };

  const isViewingOtherStudent = currentUser.id !== studentId;

  console.log("Debug info:", {
    currentUserId: currentUser.id,
    currentUserRole: currentUser.role,
    targetStudentId: targetStudent.id,
    targetStudentEncryptionKey: targetStudent.encryptionKey,
    studentId: studentId,
    studentUser: studentUser,
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
      <header className="w-full max-w-6xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToStudents}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 truncate pr-2">{isViewingOtherStudent ? `${targetStudent.username}'s Transcript` : `Welcome, ${currentUser.username}!`}</h1>
        </div>
        <form onSubmit={handleLogout} className="flex-shrink-0">
          <button
            type="submit"
            className="bg-red-500 text-white py-2 px-4 sm:py-2 sm:px-5 rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Logout
          </button>
        </form>
      </header>

      <main className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl max-w-6xl w-full">
        <div className="py-4">
          <StudentDashboard key={`student-${targetStudent.id}`} currentUser={studentUser} />
        </div>
      </main>
    </div>
  );
}
