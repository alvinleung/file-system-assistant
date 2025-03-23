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
    console.log(incomplete);
    console.log(result);
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

  let depth = 0;
  let currentStart = -1;

  // Iterate over every character
  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === "{") {
      // If we're not already inside an object, mark the start index.
      if (depth === 0) {
        currentStart = i;
      }
      depth++;
    } else if (char === "}") {
      depth--;
      // When depth returns to zero, we have a complete object candidate.
      if (depth === 0 && currentStart !== -1) {
        const objStr = input.slice(currentStart, i + 1);
        try {
          // Use eval to parse the object literal.
          const parsedObj = eval("(" + objStr + ")") as object;
          result.push(parsedObj);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // If parsing fails, consider the string as incomplete.
          incomplete.push(objStr);
        }
        // Reset start marker after processing a complete segment.
        currentStart = -1;
      }
    }
  }

  // If there's an unclosed object at the end, capture it.
  if (depth > 0 && currentStart !== -1) {
    const remaining = input.slice(currentStart);
    // Trim whitespace to avoid adding empty strings.
    if (remaining.trim()) {
      incomplete.push(remaining);
    }
  }

  return { result, incomplete };
}
