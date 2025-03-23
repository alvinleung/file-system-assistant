import { AdalinePromptType } from "@/types/adaline-prompt-type";

export function updateVariables(
  prompt: AdalinePromptType,
  variables: Record<string, string>,
) {
  prompt.variables.forEach((variable) => {
    const variableValue = variables[variable.name];
    if (variableValue === undefined) {
      console.warn(
        `Variable ${variable.name} is not provided, it may be a mistake.`,
      );
      return;
    }
    variable.value.value = variableValue;
  });
}
