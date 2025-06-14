"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useEffect } from "react";
import AdvisorDashboard from "@/components/AdvisorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import HeadDashboard from "@/components/HeadDashboard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Home() {
  const router = useRouter();
  const {
    currentUser,
    isLoadingCurrentUser,
    primaryError,
    refetchCurrentUser,
  } = useCurrentUser();

  const username = currentUser?.username;

  useEffect(() => {
    if (currentUser === undefined && !isLoadingCurrentUser) {
      router.push("/login");
    }
  }, [currentUser, isLoadingCurrentUser, router]);

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

  // Render dashboard content based on user role
  const renderDashboardContent = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case "advisors":
        return <AdvisorDashboard currentUser={currentUser} />;

      case "students":
        return <StudentDashboard currentUser={currentUser} />;

      case "head":
        return <HeadDashboard currentUser={currentUser} />;

      default:
        return (
          <>
            <h2 className="text-3xl font-semibold mb-6 text-gray-700">
              Dashboard
            </h2>
            <p className="text-lg text-gray-200">
              Welcome to your dashboard! Your role: {currentUser.role}
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
      <header className="w-full max-w-6xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
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

      <main className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl max-w-6xl w-full">
        {isLoadingCurrentUser && !primaryError ? (
          <div className="py-10 text-center">
            <p className="text-white text-xl">Loading user data...</p>
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
        ) : (
          <div className="py-4">{renderDashboardContent()}</div>
        )}
      </main>
    </div>
  );
}