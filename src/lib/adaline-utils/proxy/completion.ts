import { AdalinePromptType } from "@/types/adaline-prompt-type";

export async function* streamCompletion({
  prompt,
}: {
  prompt: AdalinePromptType;
}) {
  const response = await fetch("/api/adaline/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parses a stream of string chunks into JSON objects.
 *
 * @param {AsyncIterable<string>} stream - An async iterable stream of string chunks that may contain JSON objects
 * @yields {object[]} Arrays of parsed complete JSON objects from the stream
 */
export async function* readJSONStream(stream: AsyncIterable<string>) {
  let buffer = "";
  for await (const chunk of stream) {
    const { result, incomplete } = parseIncompleteJSON(buffer + chunk);
    buffer = incomplete.join("");
    yield { result, incomplete };
  }
}

/**
 * Parses a string containing JSON objects, handling both complete and incomplete objects.
 * This function processes the input character by character to identify JSON objects.
 *
 * @param {string} input - A string that may contain one or more JSON objects.
 * @returns {Object} An object containing two arrays:
 *   - result: Array of successfully parsed complete JSON objects.
 *   - incomplete: Array of string fragments that appear to be incomplete JSON objects.
 */
export function parseIncompleteJSON(input: string): {
  result: object[];
  incomplete: string[];
} {
  const result: object[] = [];
  const incomplete: string[] = [];

  type StackEntry = { char: "{" | "["; index: number };
  const stack: StackEntry[] = [];
  let startIndex: number | null = null;

  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === "\\") {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    } else if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      if (stack.length === 0) {
        startIndex = i;
      }
      stack.push({ char, index: i });
    } else if (char === "}" || char === "]") {
      if (stack.length > 0) {
        const last = stack[stack.length - 1];
        if (
          (last.char === "{" && char === "}") ||
          (last.char === "[" && char === "]")
        ) {
          stack.pop();
          if (stack.length === 0 && startIndex !== null) {
            const jsonStr = input.slice(startIndex, i + 1);
            try {
              const parsed = JSON.parse(jsonStr) as object;
              result.push(parsed);
            } catch {
              incomplete.push(jsonStr);
            }
            startIndex = null;
          }
        }
      }
    }
  }

  if (startIndex !== null && stack.length > 0) {
    const remaining = input.slice(startIndex);
    if (remaining.trim()) {
      incomplete.push(remaining);
    }
  }

  return { result, incomplete };
}
