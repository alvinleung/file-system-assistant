import { AdalinePromptSchema } from "@/types/adaline-type-v2";
import { z } from "zod";

export const AdalineStreamRequestSchema = z.object({
  prompt: AdalinePromptSchema,
});

export type AdalineStreamRequestType = z.infer<
  typeof AdalineStreamRequestSchema
>;
