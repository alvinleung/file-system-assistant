import { Config, Message } from "@adaline/types";
import { z } from "zod";

export const AdalineVariableSchema = z.object({
  name: z.string(),
  value: z.object({
    modality: z.string(),
    value: z.string(),
  }),
});

export type AdalineVariableType = z.infer<typeof AdalineVariableSchema>;

export const AdalineToolSchema = z.object({
  type: z.string(),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.object({
      type: z.string(),
      properties: z.record(
        z.string(),
        z.object({
          type: z.string(),
          description: z.string(),
        }),
      ),
      required: z.array(z.string()),
    }),
  }),
});

export type AdalineToolType = z.infer<typeof AdalineToolSchema>;

export const AdalinePromptSchema = z.object({
  messages: z.array(Message()),
  config: Config(),
  tools: z.array(AdalineToolSchema),
  variables: z.array(AdalineVariableSchema),
});

export type AdalinePromptType = z.infer<typeof AdalinePromptSchema>;
