"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";

interface Student {
  id: number;
  username: string;
  role: string;
  nim: string | null;
  fullName: string | null;
  gpa: number | null;
  createdAt: string | null;
  advisorId?: number;
}

interface StudentRecord {
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
}

interface FetchError extends Error {
  status?: number;
}

const fetchAllStudents = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users/students`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch all students: ${response.status} ${errorText}`
    );
  }
  return response.json();
};

const fetchMyStudents = async (advisorId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/api/users/students/${advisorId}`
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch my students: ${response.status} ${errorText}`
    );
  }
  return response.json();
};

interface AdvisorDashboardProps {
  currentUser: {
    id: number;
    username: string;
    role: string;
  };
}

export default function AdvisorDashboard({
  currentUser,
}: AdvisorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [selectedStudentRecord, setSelectedStudentRecord] =
    useState<StudentRecord | null>(null);
  const router = useRouter();

  const {
    data: allStudents,
    isLoading: isLoadingAllStudents,
    error: allStudentsError,
    refetch: refetchAllStudents,
  } = useQuery<Student[], FetchError>({
    queryKey: ["allStudents"],
    queryFn: fetchAllStudents,
    retry: 1,
  });

  const {
    data: myStudents,
    isLoading: isLoadingMyStudents,
    error: myStudentsError,
    refetch: refetchMyStudents,
  } = useQuery<Student[], FetchError>({
    queryKey: ["myStudents", currentUser.id],
    queryFn: () => fetchMyStudents(currentUser.id),
    retry: 1,
  });

  const fetchStudentRecord = async (studentId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/student-data/${studentId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch student record: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      setSelectedStudentRecord(data);
    } catch (error) {
      console.error("Error fetching student record:", error);
    }
  };

  const handleViewRecord = (studentId: number) => {
    fetchStudentRecord(studentId);
  };

  const handleRefresh = () => {
    if (activeTab === "all") {
      refetchAllStudents();
    } else {
      refetchMyStudents();
    }
  };

  const handleRequestAccess = async (studentId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/access-requests/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            advisorId: currentUser.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request access");
      }

      // Navigate to the request access page after successful request
      router.push(`/records/${studentId}/request-access`);
    } catch (error) {
      console.error("Error requesting access:", error);
      alert((error as Error).message || "Failed to request access");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatGPA = (gpa: number | string | null): string => {
    // Handles null, undefined, or empty strings
    if (gpa === null || gpa === undefined || gpa === "") {
      return "N/A";
    }

    // Convert input to a number. Handles both actual numbers and string numbers.
    const numericGpa = Number(gpa);

    // If the conversion results in NaN (e.g., for a random string like "abc"),
    // return "N/A".
    if (isNaN(numericGpa)) {
      return String(gpa);
    }

    // If it's a valid number, format it to two decimal places.
    return numericGpa.toFixed(2);
  };

  const renderStudentsTable = (
    students: Student[] | undefined,
    isLoading: boolean,
    error: FetchError | null
  ) => {
    if (isLoading) {
      return (
        <div className="py-10 text-center">
          <p className="text-gray-600">Loading students...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-10 text-center">
          <p className="text-red-600 mb-4">Error: {error.message}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!students || students.length === 0) {
      return (
        <div className="py-10 text-center">
          <p className="text-gray-600">No students found.</p>
        </div>
      );
    }

    if (selectedStudentRecord && activeTab === "mine") {
      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Student Record
            </h3>
            <button
              onClick={() => setSelectedStudentRecord(null)}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-150"
            >
              Back to List
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-4">
              Student Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium text-gray-900">
                  {selectedStudentRecord.studentRecord.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">NIM</p>
                <p className="font-medium text-gray-900">
                  {selectedStudentRecord.studentRecord.nim}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Program</p>
                <p className="font-medium text-gray-900">
                  {selectedStudentRecord.studentRecord.program}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">GPA</p>
                <p className="font-medium text-gray-900">
                  {selectedStudentRecord.studentRecord.gpa}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-medium text-gray-700 mb-4">
              Course Grades
            </h4>
            {selectedStudentRecord.grades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Course Code
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedStudentRecord.grades.map((grade, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {grade.courseCode}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">
                          {grade.grade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No grades available.</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Username
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                NIM
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Full Name
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                GPA
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Created At
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="py-4 px-4 text-sm text-gray-900">
                  {student.username}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {student.nim || "N/A"}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {student.fullName || "N/A"}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {formatGPA(student.gpa)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {formatDate(student.createdAt)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {student.advisorId === currentUser.id && (
                    <button
                      onClick={() => handleViewRecord(student.id)}
                      className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600 transition duration-150 text-xs font-semibold"
                    >
                      View Record
                    </button>
                  )}
                  {!student.advisorId && (
                    <button
                      onClick={() => router.push(`/records/${student.id}/add`)}
                      className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600 transition duration-150 text-xs font-semibold"
                    >
                      Add Record
                    </button>
                  )}
                  {student.advisorId &&
                    student.advisorId !== currentUser.id && (
                      <button
                        onClick={() => handleRequestAccess(student.id)}
                        className="bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600 transition duration-150 text-xs font-semibold"
                      >
                        Request Access
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Student Management
        </h2>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition duration-150 ${
              activeTab === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            All Students ({allStudents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition duration-150 ${
              activeTab === "mine"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            My Students ({myStudents?.length || 0})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {activeTab === "all" ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                All Students
              </h3>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150 text-sm"
              >
                Refresh
              </button>
            </div>
            {renderStudentsTable(
              allStudents,
              isLoadingAllStudents,
              allStudentsError
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">My Students</h3>
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150 text-sm"
              >
                Refresh
              </button>
            </div>
            {renderStudentsTable(
              myStudents,
              isLoadingMyStudents,
              myStudentsError
            )}
          </div>
        )}
      </div>
    </div>
  );
}
