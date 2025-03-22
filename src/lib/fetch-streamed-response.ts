import { AdalinePromptType } from "@/types/adaline-prompt-type";

export async function fetchStreamedResponse(
  promptWithVariables: string,
  sourcePrompt: AdalinePromptType,
  onData: (chunk: string, done: boolean) => void
) {
  const response = await fetch("/api/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: promptWithVariables,
      tools: sourcePrompt.tools,
    }),
  });

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function read() {
    const { done, value } = await reader.read();
    if (done) {
      onData("", true);
      return;
    }

    const chunk = decoder.decode(value, { stream: true });

    onData(chunk, false);
    read();
  }

  read();
}

// a- stands for assistant
// t- stands for tool
type CompletionMessageType = "tool" | "assistant" | undefined;
type DecipheredMessage = {
  type: CompletionMessageType;
  content: string;
};
export function decipherStream(loadedChunks: string): DecipheredMessage {
  let type: CompletionMessageType = undefined;
  switch (loadedChunks[0]) {
    case "t":
      type = "tool";
      break;
    case "a":
      type = "assistant";
      break;
  }
  return {
    type,
    content: loadedChunks.slice(2),
  };
}
