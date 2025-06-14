// src/components/StudentDashboard.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

interface StudentDashboardProps {
  currentUser: {
    id: number;
    username: string;
    role: string;
    encryptionKey?: string;
  };
}

interface StudentGrade {
  userId: number;
  courseCode: string;
  grade: string;
}

interface StudentRecord {
  userId: number;
  nim: string;
  program: string;
  fullName: string;
  gpa: string;
}

interface StudentDataResult {
  studentRecord: StudentRecord;
  grades: StudentGrade[];
  verified: boolean;
  publicKey: string;
}

interface Course {
  code: string;
  name: string;
  credits: number;
}

interface FetchError extends Error {
  status?: number;
}

const fetchStudentData = async (userId: number): Promise<StudentDataResult> => {
  try {
    console.log("Fetching student data for user ID:", userId);
    const response = await fetch(`/api/student-data/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch student data");
    }
    return response.json();
  } catch (error) {
    console.error("Error in fetchStudentData:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch student data"
    );
  }
};

const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch("/api/courses");
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
};

export default function StudentDashboard({
  currentUser,
}: StudentDashboardProps) {
  console.log("StudentDashboard - Current User:", currentUser);

  const {
    data: studentData,
    isLoading: isLoadingStudentData,
    error: studentDataError,
    refetch: refetchStudentData,
  } = useQuery<StudentDataResult, FetchError>({
    queryKey: ["studentData", currentUser.id],
    queryFn: () => fetchStudentData(currentUser.id), // Pass the currentUser.id to the function
    retry: 1,
  });

  const {
    data: courses = [],
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const coursesMap = new Map(courses.map((course) => [course.code, course]));

  const handleRefresh = () => {
    refetchStudentData();
  };

  const getCourseInfo = (courseCode: string) => {
    return coursesMap.get(courseCode) || { name: courseCode, credits: 0 };
  };

  const formatGrade = (grade: string) => {
    const numericGrade = parseFloat(grade);
    return numericGrade.toFixed(2);
  };

  const getLetterGrade = (numericGrade: number): string => {
    if (numericGrade >= 3.7) return "A";
    if (numericGrade >= 3.3) return "A-";
    if (numericGrade >= 3.0) return "B+";
    if (numericGrade >= 2.7) return "B";
    if (numericGrade >= 2.3) return "B-";
    if (numericGrade >= 2.0) return "C+";
    if (numericGrade >= 1.7) return "C";
    if (numericGrade >= 1.3) return "C-";
    if (numericGrade >= 1.0) return "D";
    return "F";
  };

  const getGradeColor = (letterGrade: string): string => {
    switch (letterGrade) {
      case "A":
      case "A-":
        return "bg-green-100 text-green-800";
      case "B+":
      case "B":
      case "B-":
        return "bg-blue-100 text-blue-800";
      case "C+":
      case "C":
      case "C-":
        return "bg-yellow-100 text-yellow-800";
      case "D":
        return "bg-orange-100 text-orange-800";
      case "F":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalCredits = (): number => {
    if (!studentData?.grades) return 0;
    return studentData.grades.reduce((total, grade) => {
      const courseInfo = getCourseInfo(grade.courseCode);
      return total + courseInfo.credits;
    }, 0);
  };

  const renderTranscriptHeader = () => {
    if (!studentData?.studentRecord) return null;

    const { studentRecord, verified } = studentData;

    return (
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Student Name
            </label>
            <p className="text-sm text-gray-900 font-medium">
              {studentRecord?.fullName || "N/A"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Student ID (NIM)
            </label>
            <p className="text-sm text-gray-900 font-mono">
              {studentRecord?.nim || "N/A"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Program
            </label>
            <p className="text-sm text-gray-900">
              {studentRecord?.program === "IF"
                ? "Informatics Engineering"
                : studentRecord?.program === "STI"
                ? "Information Systems and Technology"
                : "Unknown"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              GPA
            </label>
            <p className="text-lg font-bold text-blue-600">
              {studentRecord?.gpa || "0.00"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Credits
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {getTotalCredits()}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Verification Status
            </label>
            <div
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                verified
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {verified ? "✅ Verified" : "❌ Unverified"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTranscriptTable = () => {
    if (isLoadingStudentData || isLoadingCourses) {
      return (
        <div className="py-10">
          <p className="text-gray-600">Loading your transcript...</p>
        </div>
      );
    }

    const error = studentDataError || coursesError;
    if (error) {
      return (
        <div className="py-10">
          <p className="text-red-600 mb-4">
            Error: {(error as FetchError).message}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (
      !studentData ||
      !studentData.grades ||
      studentData.grades.length === 0
    ) {
      return (
        <div className="py-10">
          <div className="text-center text-gray-600">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No grades recorded
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Grades will appear here once uploaded by your advisor.
            </p>
          </div>
        </div>
      );
    }

    const { grades } = studentData;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                No
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Course Code
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Course Name
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Credits
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {grades.map((grade: StudentGrade, index: number) => {
              const numericGrade = parseFloat(grade?.grade || "0");
              const letterGrade = getLetterGrade(numericGrade);
              const courseInfo = getCourseInfo(grade?.courseCode || "");

              return (
                <tr
                  key={`${grade?.userId || index}-${
                    grade?.courseCode || index
                  }`}
                  className="hover:bg-gray-50"
                >
                  <td className="py-4 px-4 text-sm text-gray-900 text-center">
                    {index + 1}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium text-center">
                    {grade?.courseCode || "N/A"}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {courseInfo.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 text-center">
                    {courseInfo.credits}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      <span className="font-mono">
                        {formatGrade(grade?.grade || "0")}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(
                          letterGrade
                        )}`}
                      >
                        {letterGrade}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Academic Transcript
        </h2>
      </div>

      {renderTranscriptHeader()}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Course Grades ({studentData?.grades?.length || 0} courses)
            </h3>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150 text-sm"
              disabled={isLoadingStudentData || isLoadingCourses}
            >
              {isLoadingStudentData || isLoadingCourses
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
          {renderTranscriptTable()}
        </div>
      </div>
    </div>
  );
}