import { useQuery } from "@tanstack/react-query";
import { getAdalinePrompt } from "./adaline-client";

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
