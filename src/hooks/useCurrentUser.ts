import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";

interface User {
  id: number;
  username: string;
  role: string;
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

export function useCurrentUser() {
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

  const currentUser =
    currentUserResponse && !("status" in currentUserResponse)
      ? (currentUserResponse as User)
      : undefined;

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

  return {
    currentUser,
    isLoadingCurrentUser,
    currentUserError,
    refetchCurrentUser,
    isCurrentUserError,
    primaryError,
  };
}
