"use client";
import { useQuery } from "@tanstack/react-query";

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
}

interface FetchError extends Error {
  status?: number;
}

const fetchProgramStudents = async () => {
  const response = await fetch(`/api/users/students`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch program students");
  }
  return response.json();
};

interface HeadDashboardProps {
  currentUser: {
    id: number;
    username: string;
    role: string;
    program?: string;
  };
}

export default function HeadDashboard({ currentUser }: HeadDashboardProps) {
  const {
    data: students,
    isLoading,
    error,
    refetch,
  } = useQuery<Student[], FetchError>({
    queryKey: ["programStudents"],
    queryFn: fetchProgramStudents,
    retry: 1,
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatGPA = (gpa: string | null) => {
    if (!gpa) return "N/A";
    return parseFloat(gpa).toFixed(2);
  };

  const getProgramName = (program: string) => {
    return program === "IF" ? "Teknik Informatika" : "Sistem dan Teknologi Informasi";
  };

  const getTitle = () => {
    return "All Students";
  };

  const renderStudentsTable = () => {
    if (isLoading) {
      return (
        <div className="py-10">
          <p className="text-gray-600">Loading students...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-10">
          <p className="text-red-600 mb-4">Error: {error.message}</p>
          <button onClick={handleRefresh} className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150">
            Try Again
          </button>
        </div>
      );
    }

    if (!students || students.length === 0) {
      return (
        <div className="py-10">
          <p className="text-gray-600">No students found in your program.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Username</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">NIM</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Full Name</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">GPA</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Advisor</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Created At</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="py-4 px-4 text-sm text-gray-900">{student.username}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{student.nim || "N/A"}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{student.fullName || "N/A"}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{formatGPA(student.gpa)}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{student.advisorId ? `Advisor ID: ${student.advisorId}` : "Not Assigned"}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{formatDate(student.createdAt)}</td>
                <td className="py-4 px-4 text-sm text-gray-900 text-center">
                  {/* TODO: Replace with actual transcript link */}
                  <a href={``} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition duration-150 inline-block">
                    View Transcript
                  </a>
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
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">{getTitle()}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800"></h3>
            <button onClick={handleRefresh} className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150 text-sm" disabled={isLoading}>
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
          {renderStudentsTable()}
        </div>
      </div>
    </div>
  );
}
