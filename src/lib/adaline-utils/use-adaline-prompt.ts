import { useQuery } from "@tanstack/react-query";
import { AdalinePromptType } from "@/types/adaline-prompt-type";

/**
 * React hook for fetching the Adaline prompt for a given project ID.
 */
export function useAdalinePrompt(projectId: string) {
  const {
    data,
    isLoading: isPromptLoading,
    error,
  } = useQuery({
    queryKey: [`${projectId}`],
    queryFn: async () => await getAdalinePrompt(projectId),
  });

  return {
    isPromptLoading,
    prompt: data,
    error,
  };
}

const cached: Record<string, AdalinePromptType> = {};
async function getAdalinePrompt(projectId: string): Promise<AdalinePromptType> {
  if (cached[projectId]) return cached[projectId];

  const response = await fetch(`/api/adaline/prompt?projectId=${projectId}`); // Updated to call the API route
  if (!response.ok) {
    throw new Error("network response was not ok");
  }
  const responseJson = (await response.json()).prompt as AdalinePromptType;

  cached[projectId] = responseJson;

  return responseJson;
}

export async function sendLogToAdaline(logData: {
  projectId: string;
  provider: string;
  model: string;
  completion: string;
  cost?: string;
  latency?: number;
  inputTokens?: string;
  outputTokens?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, string>;
  referenceId?: string;
}): Promise<string | undefined> {
  const response = await fetch("/api/adaline/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(logData),
  });

  if (!response.ok) {
    console.error("Failed to send log to Adaline");
    return undefined;
  }

  const responseData = await response.json();
  return responseData.message; // Assuming the message is returned in the response
}
