import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const TempInput = ({
  value,
  onConfirm,
  onExitEdit,
  onBeginEdit,
}: {
  value: string;
  onConfirm?: (latest: string) => void;
  onBeginEdit?: () => void;
  onExitEdit?: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [tempValue, setTempValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
  }, [isEditing]);

  return (
    <div>
      <span
        className={cn(isEditing ? "hidden" : "block")}
        onDoubleClick={() => {
          setIsEditing(true);
          setTempValue(value);
        }}
      >
        {value}
      </span>
      <input
        className={cn(isEditing ? "block" : "hidden")}
        onChange={(e) => setTempValue(e.target.value)}
        ref={inputRef}
        value={tempValue}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // commit
            onConfirm?.(tempValue);
            onExitEdit?.();
            setIsEditing(false);
          }
          if (e.key === "Escape") {
            // cancel
            setIsEditing(false);
            onExitEdit?.();
            onBeginEdit?.();
            setTempValue(value);
          }
        }}
      />
    </div>
  );
};
