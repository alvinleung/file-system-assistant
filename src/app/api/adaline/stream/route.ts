/**
 * @fileoverview
 * This file contains the implementation of LLM usage by using Adaline api
 */
import { NextResponse } from "next/server";
import { Gateway } from "@adaline/gateway";
import { OpenAI } from "@adaline/openai";
import { Config, ToolType, MessageType } from "@adaline/types";
import { AdalinePromptType, AdalineToolType } from "@/types/adaline-type-v2";
import { AdalineStreamRequestSchema } from "./types";
import {
  AssistantResponseType,
  ToolCallResponseType,
} from "@/lib/adaline-utils/proxy/types";

const gateway = new Gateway();
const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const result = AdalineStreamRequestSchema.safeParse(await req.json());

    if (result.error) {
      throw new Error(result.error.message);
    }

    const prompt = result.data.prompt;

    const config = Config().parse(prompt.config);
    const messages: MessageType[] = compileChatMessageWithVariables(prompt);

    const model = openai.chatModel({
      modelName: config.model,
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const stream = gateway.streamChat({
      model,
      config,
      messages: messages,
      tools: prompt.tools.map((tool) => convertToAdalineTool(tool)),
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const latestChunk = chunk.response.partialMessages[0].partialContent;

          const previouslyStreamed: Partial<ToolCallResponseType> = {};
          if (latestChunk.modality === "partial-tool-call") {
            const res: ToolCallResponseType = {
              id: previouslyStreamed.id ? undefined : previouslyStreamed.id,
              type: "tool-call",
              name: previouslyStreamed.name
                ? undefined
                : previouslyStreamed.name,
              partialArguments: latestChunk.arguments,
            };
            // send to client
            controller.enqueue(encoder.encode(JSON.stringify(res)));
          }

          if (latestChunk.modality === "partial-text") {
            const res = JSON.stringify({
              type: "assistant",
              partialContent: latestChunk.value || "",
            } as AssistantResponseType);

            // send to client
            controller.enqueue(encoder.encode(res));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

function compileChatMessageWithVariables(
  prompt: AdalinePromptType,
): MessageType[] {
  return prompt.messages.map((message) => {
    if (
      message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system"
    ) {
      return {
        ...message,
        content: message.content.map((content) => {
          // skip non-text message for replacing variable
          if (content.modality !== "text") return { ...content };

          let replacedMessage: string = content.value;
          // replace all the variables for text variables
          prompt.variables.forEach(({ value, name }) => {
            // only replace text variable modality
            if (value.modality !== "text") return;
            replacedMessage = replacedMessage.replaceAll(
              `{${name}}`,
              value.value,
            );
          });

          return {
            modality: content.modality,
            value: replacedMessage,
          };
        }),
      };
    }
    return message;
  });
}

function convertToAdalineTool(tool: AdalineToolType): ToolType {
  return {
    type: "function",
    definition: {
      schema: {
        name: tool.schema.name,
        description: tool.schema.description,
        parameters: tool.schema.parameters,
      },
    },
  };
}
