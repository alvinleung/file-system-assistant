import React, { useCallback, useEffect, useRef, useState } from "react";
import { AutoResizingTextarea } from "./auto-resizing-textarea";
import { cn, mapSet } from "@/lib/utils";
import { useAdalinePrompt } from "@/lib/adaline-utils/use-adaline-prompt";
import { useVFS } from "./virtual-file-system/vfs-context";
import { serializeNode } from "./virtual-file-system/vfs-serialization";
import {
  readJSONStream,
  streamCompletion,
} from "@/lib/adaline-utils/proxy/completion";
import { ServerStreamResponse } from "@/lib/adaline-utils/proxy/types";

function extractFileName(filePath: string): string {
  const pathParts = filePath.split("/");
  return pathParts[pathParts.length - 1];
}

import USER_INFO from "@/data/user-info.json";

type AssistantStates = "streaming" | "ready";

const AssistantPopUp = ({
  selectedFiles,
  lastClickedIndex,
}: {
  lastClickedIndex: number | null;
  selectedFiles: Set<string>;
}) => {
  const [assistantState, setAssistantState] =
    useState<AssistantStates>("ready");
  const [assistantResponse, setAssistantResponse] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldShowPopup = selectedFiles.size > 0;

  const vfs = useVFS();

  const { prompt, isPromptLoading } = useAdalinePrompt(
    "c5166aaa-dd75-40fc-bdbe-33407b8037cf",
  );

  useEffect(() => {
    if (!shouldShowPopup) {
      setAssistantResponse("");
    }
  }, [shouldShowPopup]);

  useEffect(() => {
    if (!shouldShowPopup) return;
    textareaRef.current?.focus();
  }, [shouldShowPopup, selectedFiles]);

  const [userQuery, setUserQuery] = useState("");
  const isPromptEmpty = userQuery === "";

  const handleSubmit = useCallback(() => {
    // submit here
    // console.log(userQuery, selectedFiles);

    if (isPromptLoading || !prompt) {
      console.warn("prompt still loading...");
      return;
    }

    const variablesInput: Record<string, string> = {
      user_query: userQuery,
      selected_files: JSON.stringify([...selectedFiles]),
      systemFiles: JSON.stringify(serializeNode(vfs.getDirectory(""))),
      user_info: JSON.stringify(USER_INFO),
    };

    setAssistantState("streaming");
    setAssistantResponse("");

    // replace values in prompt
    prompt.variables.forEach((variable) => {
      variable.value.value = variablesInput[variable.name];
    });

    (async function () {
      const stream = streamCompletion({
        prompt,
      });

      // Process each chunk as it arrives
      for await (const jsonChunk of readJSONStream(stream)) {
        // parse each json chunk, sometimes, there could be more than one chunk
        jsonChunk.result.forEach((json) => {
          const { data, error } = ServerStreamResponse.safeParse(json);
          if (error) {
            console.warn(error.message);
            console.log(json);
            return;
          }

          // Update UI with the new chunk here
          if (data.type === "assistant") {
            setAssistantResponse((prev) => prev + data.partialContent);
          }

          if (data.type === "tool-call") {
            // render loaded tool here
            setAssistantResponse((prev) => prev + data.partialArguments);
          }
        });
      }
      setAssistantState("ready");
    })();
  }, [isPromptLoading, prompt, userQuery, selectedFiles, vfs]);

  return (
    <div className="relative">
      {shouldShowPopup && lastClickedIndex !== null && (
        <div
          className={cn(
            "relative min-h-10 border rounded-lg px-2 bg-white ",
            isPromptEmpty ? "border-transparent" : "border-zinc-200 shadow-xs",
          )}
          style={{
            // top: `${lastClickedIndex * 32 + 48}px`,
            opacity: assistantState === "streaming" ? 0.5 : 1,
          }}
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!isPromptEmpty && (
            <div className="flex flex-row text-xs py-2 gap-2">
              {mapSet(selectedFiles, (filePath, index) => {
                return (
                  <span
                    key={index}
                    className="bg-zinc-50 px-1 py-0.5 border border-zinc-200 rounded-sm text-zinc-600"
                  >
                    {extractFileName(filePath)}
                  </span>
                );
              })}
            </div>
          )}
          <AutoResizingTextarea
            placeholder="Do something with the files..."
            onChange={setUserQuery}
            onSubmit={handleSubmit}
            ref={textareaRef}
            value={userQuery}
          />
          {assistantResponse && (
            <div className="w-full px-1 py-1 text-sm text-zinc-700 border-t border-zinc-200">
              {assistantResponse}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AssistantPopUp;
