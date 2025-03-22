import React, { forwardRef, useImperativeHandle } from "react";

interface AutoResizingTextareaProps {
  value: string; // New prop to drive the textarea content
  placeholder: string;
  onChange?: (value: string) => void; // Optional API for handling changes
  onSubmit?: () => void; // Optional API for handling form submission or Enter key press
  onBlur?: () => void; // Optional API for handling blur event
}

const AutoResizingTextareaComponent = (
  { value, placeholder, onChange, onSubmit, onBlur }: AutoResizingTextareaProps,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset the height to auto first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Adjust based on content
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(event.target.value); // Call the passed-in onChange API with the new value
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent the default Enter behavior (new line)
      if (onSubmit) {
        onSubmit(); // Call the onSubmit callback
      }
    }
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(); // Call the onBlur callback if provided
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value} // Controlled by the value prop
      placeholder={placeholder}
      className="w-full text-sm p-1 border-none text-zinc-700 focus:border-none outline-0 rounded resize-none overflow-hidden"
      onInput={handleInput}
      onChange={handleChange} // Attach the onChange handler
      onKeyDownCapture={handleKeyDown} // Attach the onKeyDown handler to catch Enter key press
      onBlur={handleBlur} // Attach the onBlur handler
      style={{ height: "auto", minHeight: "1.5em" }} // minHeight adjusts to 1 line of text
      rows={1} // Makes the default scroll height 1 line
    />
  );
};

export const AutoResizingTextarea = forwardRef(AutoResizingTextareaComponent);
AutoResizingTextarea.displayName = "AutoResizingTextarea";
