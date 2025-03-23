import { z } from "zod";

export const ToolCallResponse = z.object({
  type: z.literal("tool-call"),
  partialArguments: z.string().optional(),
  name: z.string().optional(),
  id: z.string().optional(),
});

export const AssistantResponse = z.object({
  type: z.literal("assistant"),
  partialContent: z.string(),
});

export const ServerStreamResponse = z.discriminatedUnion("type", [
  ToolCallResponse,
  AssistantResponse,
]);

export type ToolCallResponseType = z.infer<typeof ToolCallResponse>;
export type AssistantResponseType = z.infer<typeof AssistantResponse>;
export type ServerStreamResponseType = z.infer<typeof ServerStreamResponse>;
