"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";

interface Course {
  code: string;
  name: string;
  credits: number;
}

interface FetchError extends Error {
  status?: number;
}

interface ApiErrorResponse {
  status: number;
  error: string;
}

const fetchCourses = async (): Promise<Course[] | ApiErrorResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/courses`);
  if (!response.ok) {
    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch courses: ${response.status} ${errorText}`);
  }
  return response.json();
};

export default function CoursesPage() {
  const router = useRouter();

  const {
    data: coursesResponse,
    isLoading: isLoadingCourses,
    error: coursesError,
    refetch: refetchCourses,
    isError: isCoursesError,
  } = useQuery<Course[] | ApiErrorResponse, FetchError>({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    retry: 1,
  });

  const courses =
    coursesResponse && !("status" in coursesResponse) ? coursesResponse : [];

  // Redirect to login if unauthorized
  if (
    coursesResponse &&
    "status" in coursesResponse &&
    coursesResponse.status === 401
  ) {
    router.push("/login");
    return null;
  }

  const handleTryAgainClick = () => {
    refetchCourses();
  };

  const getErrorMessage = (
    queryError: FetchError | ApiErrorResponse | null | undefined,
    defaultMessage: string
  ): string | null => {
    if (!queryError) return null;
    if (queryError instanceof Error) {
      return queryError.message;
    }
    if (
      typeof queryError === "object" &&
      "error" in queryError &&
      typeof queryError.error === "string"
    ) {
      return queryError.error;
    }
    return defaultMessage;
  };

  const primaryError = isCoursesError
    ? getErrorMessage(coursesError, "Failed to load courses.")
    : null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
          Available Courses
        </h1>
        <button
          onClick={() => router.push("/")}
          className="bg-gray-500 text-white py-2 px-4 sm:py-2 sm:px-5 rounded-lg font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg whitespace-nowrap"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl max-w-4xl w-full">
        {isLoadingCourses && !primaryError ? (
          <div className="py-10 text-center">
            <p className="text-white text-xl">Loading courses...</p>
          </div>
        ) : primaryError ? (
          <div className="py-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Error</h2>
            <p className="text-lg mb-6 text-gray-200">{primaryError}</p>
            <button
              onClick={handleTryAgainClick}
              className="w-full max-w-xs mx-auto bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="py-10 text-center">
            <h2 className="text-3xl font-semibold mb-4 text-gray-700">
              No Courses Found
            </h2>
            <p className="text-lg text-gray-200">
              There are no courses available at the moment.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 text-center">
              Course List ({courses.length} courses)
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.code}
                  className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-sm p-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate pr-2">
                      {course.code}
                    </h3>
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                      {course.credits} credits
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {course.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
