import React, { useCallback, useEffect, useRef, useState } from "react";
import { AutoResizingTextarea } from "./auto-resizing-textarea";
import { cn, mapSet } from "@/lib/utils";

function extractFileName(filePath: string): string {
  const pathParts = filePath.split("/");
  return pathParts[pathParts.length - 1];
}

const AssistantPopUp = ({
  selectedFiles,
  lastClickedIndex,
}: {
  lastClickedIndex: number | null;
  selectedFiles: Set<string>;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldShowPopup = selectedFiles.size > 0;

  useEffect(() => {
    if (!shouldShowPopup) return;
    textareaRef.current?.focus();
  }, [shouldShowPopup, selectedFiles]);

  const [prompt, setPrompt] = useState("");
  const isPromptEmpty = prompt === "";
  const handleSubmit = useCallback(() => {
    // submit here
    console.log(prompt, selectedFiles);
  }, [prompt, selectedFiles]);

  return (
    <div className="relative">
      {shouldShowPopup && lastClickedIndex !== null && (
        <div
          className={cn(
            "relative min-h-10 border rounded-sm px-1 bg-white ",
            isPromptEmpty ? "border-transparent" : "border-zinc-200 shadow-xs"
          )}
          // style={{
          //   top: `${lastClickedIndex * 32 + 48}px`,
          // }}
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!isPromptEmpty && (
            <div className="flex flex-row text-xs py-1 gap-1">
              {mapSet(selectedFiles, (filePath, index) => {
                return (
                  <span
                    key={index}
                    className="bg-zinc-50 px-1 border border-zinc-200 rounded-xs text-zinc-600"
                  >
                    {extractFileName(filePath)}
                  </span>
                );
              })}
            </div>
          )}
          <AutoResizingTextarea
            placeholder="Do something with the files.."
            onChange={setPrompt}
            onSubmit={handleSubmit}
            ref={textareaRef}
            value={prompt}
          />
        </div>
      )}
    </div>
  );
};
export default AssistantPopUp;
