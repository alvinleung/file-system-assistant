import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { ChatCompletionTool } from "openai/resources/index.mjs";

export type AdalineTool = {
  function: string;
  type: string;
  schema: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<
        string,
        {
          type: string;
          description: string;
        }
      >;
      required: string[];
    };
  };
};

function convertAdalineToolToOpenAI(
  adalineTool: AdalineTool
): ChatCompletionTool {
  // Mapping the AdalineTool to OpenAI format
  return {
    type: "function",
    function: {
      name: adalineTool.schema.name, // The name of the function (tool)
      description: adalineTool.schema.description, // The description of the function (tool)
      parameters: {
        type: adalineTool.schema.parameters.type, // Should be "object"
        properties: adalineTool.schema.parameters.properties, // Parameter properties
        required: adalineTool.schema.parameters.required, // Required parameters
      },
    },
  };
}

interface AssistantToolCall {
  name?: string;
  id?: string;
  argumentStream: string;
}

export async function POST(req: Request) {
  try {
    const { prompt, tools }: { prompt: string; tools?: AdalineTool[] } =
      await req.json();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    console.log(JSON.stringify(tools));

    if (!tools) {
      throw "tools not found in the request";
    }
    const openAiTools = tools.map((tool) => convertAdalineToolToOpenAI(tool));

    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo", // or another model
      messages: [{ role: "system", content: prompt }],
      tools: openAiTools,
      stream: true,
      tool_choice: "auto",
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let isFirstLoop = true;
        const assistantToolCall: AssistantToolCall = {
          argumentStream: "",
        };

        const TOOL_CALL_FLAG = "t-";
        const ASSISTANT_FLAG = "a-";

        // CASE - TOOL CALL
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;

          if (chunk.choices[0].finish_reason) {
            // just stop where there is stop token
            continue;
          }

          if (delta.tool_calls) {
            const toolCall = delta.tool_calls[0];
            if (toolCall.function?.name) {
              assistantToolCall.name = toolCall.function?.name;
              controller.enqueue(encoder.encode(TOOL_CALL_FLAG));
            }

            if (toolCall.id) {
              assistantToolCall.id = toolCall.id;
            }

            if (toolCall.function) {
              controller.enqueue(encoder.encode(toolCall.function.name));
              controller.enqueue(encoder.encode(toolCall.function.arguments));
              assistantToolCall.argumentStream += toolCall.function.arguments;
            }
            continue;
          }

          // CASE - PURE TEXT
          if (isFirstLoop) {
            controller.enqueue(encoder.encode(ASSISTANT_FLAG));
            isFirstLoop = false;
          }
          controller.enqueue(encoder.encode(delta.content || ""));
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
      { status: 500 }
    );
  }
}
