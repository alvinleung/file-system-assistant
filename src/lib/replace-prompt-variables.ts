/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdalinePromptType } from "@/types/adaline-prompt-type";

interface Variables {
  [key: string]: string;
}

export function replacePromptVariables({
  prompt,
  variables,
}: {
  variables: Variables;
  prompt: AdalinePromptType;
}): string {
  let systemMessageContent = prompt.messages[0].content[0].value;
  for (const key in variables) {
    systemMessageContent = systemMessageContent.replaceAll(
      `{${key}}`,
      variables[key]
    );
  }

  return systemMessageContent;
}
