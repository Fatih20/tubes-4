"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  publicKey: string;
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
    throw new Error(
      `Failed to fetch current user: ${response.status} ${errorText}`
    );
  }
  return response.json();
};

export default function Home() {
  const router = useRouter();

  const {
    data: currentUserResponse,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
    refetch: refetchCurrentUser,
    isError: isCurrentUserError,
  } = useQuery<User | ApiErrorResponse, FetchError>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 1,
  });

  const username =
    currentUserResponse && !("status" in currentUserResponse)
      ? currentUserResponse.username
      : undefined;

  useEffect(() => {
    if (
      currentUserResponse &&
      "status" in currentUserResponse &&
      currentUserResponse.status === 401
    ) {
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
        console.error(
          "Logout API call failed:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching logout API:", error);
    }
    router.push("/login");
  }

  const handleTryAgainClick = () => {
    refetchCurrentUser();
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

  const primaryError = isCurrentUserError
    ? getErrorMessage(currentUserError, "Failed to load your profile.")
    : null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
      <header className="w-full max-w-3xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 truncate pr-2">
          {isLoadingCurrentUser && !username
            ? "Loading..."
            : username
            ? `Welcome, ${username}!`
            : "Welcome!"}
        </h1>
        <form onSubmit={handleLogout} className="flex-shrink-0">
          <button
            type="submit"
            className="bg-red-500 text-white py-2 px-4 sm:py-2 sm:px-5 rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Logout
          </button>
        </form>
      </header>

      <main className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl text-center max-w-3xl w-full">
        {isLoadingCurrentUser && !primaryError ? (
          <div className="py-10">
            <p className="text-white text-xl">Loading user data...</p>
          </div>
        ) : primaryError ? (
          <div className="py-10">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Error</h2>
            <p className="text-lg mb-6 text-gray-200">{primaryError}</p>
            <button
              onClick={handleTryAgainClick}
              className="w-full max-w-xs mx-auto bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="py-10">
            <h2 className="text-3xl font-semibold mb-6 text-gray-700">
              Dashboard
            </h2>
            <p className="text-lg text-gray-200">Welcome to your dashboard!</p>
          </div>
        )}
      </main>
    </div>
  );
}
