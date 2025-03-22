/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { useVFS } from "./vfs-context";
import { LucideFile, LucideFolder, LucideArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import AssistantPopUp from "../assistant-popup";

interface FileManagerProps {
  initial: object;
  onSelect?: (
    selectedPaths: Set<string>,
    currentSelectionIndex: number | null
  ) => void; // Modify onSelect to return full paths and lastClickedIndex
}

export const FileManager: React.FC<FileManagerProps> = ({
  initial,
  onSelect,
}) => {
  const vfs = useVFS(initial);
  const [filePath, setFilePath] = useState<string>("");
  const [directoryContent, setDirectoryContent] = useState(
    vfs.getDirectory("")
  );
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [currentClickIndex, setCurrentClickIndex] = useState<number | null>(
    null
  );
  const fileManagerRef = useRef<HTMLDivElement | null>(null); // Reference for the file manager container

  // Reactively fetch the directory content when filePath changes
  useEffect(() => {
    const refreshDirectory = () => {
      try {
        const directory = vfs.getDirectory(filePath);
        setDirectoryContent(directory);

        setSelectedItems(new Set()); // Deselect all when changing directory
        onSelect?.(new Set(), null);
      } catch (error: any) {
        console.log(error);
      }
    };

    refreshDirectory();
  }, [filePath, onSelect, vfs]);

  // Click away handler to deselect all items
  useEffect(() => {
    const handleClickAway = (e: MouseEvent) => {
      if (
        fileManagerRef.current &&
        !fileManagerRef.current.contains(e.target as Node)
      ) {
        setSelectedItems(new Set()); // Deselect all when clicking outside
        onSelect?.(new Set(), null);
      }
    };

    document.addEventListener("click", handleClickAway);
    return () => {
      document.removeEventListener("click", handleClickAway);
    };
  }, [onSelect]);

  // Convert directory content (Map) into an array of nodes
  const directoryNodes = Array.from(directoryContent.children.values());

  const toggleSelection = (
    itemName: string,
    index: number,
    event: React.MouseEvent
  ) => {
    const fullPath = `${filePath}/${itemName}`.replace(/\/+/g, "/"); // Construct full path and remove double slashes

    let newSelection = new Set(selectedItems);

    if (event.shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      newSelection = new Set<string>();
      for (let i = start; i <= end; i++) {
        const node = directoryNodes[i];
        if (node) {
          const path = `${filePath}/${node.name}`.replace(/\/+/g, "/");
          console.log("Adding to selection:", path); // Debugging line
          newSelection.add(path);
        }
      }
      setSelectedItems(newSelection);
      setLastClickedIndex(index);
    } else {
      setLastClickedIndex(index);
      if (event.metaKey || event.ctrlKey) {
        // Toggle selection if Ctrl or Meta key is pressed
        if (newSelection.has(fullPath)) {
          console.log("Removing from selection:", fullPath); // Debugging line
          newSelection.delete(fullPath);
        } else {
          console.log("Adding to selection:", fullPath); // Debugging line
          newSelection.add(fullPath);
        }
      } else {
        // Select a single item
        newSelection = new Set([fullPath]);
      }
      setSelectedItems(newSelection);
    }

    setCurrentClickIndex(index);
    onSelect?.(newSelection, index);
  };

  const handleDoubleClick = (node: any) => {
    if (node.isDirectory) {
      const newPath = `${filePath}/${node.name}`.replace(/\/+/g, "/"); // Ensure no double slashes
      setFilePath(newPath);
    }
  };

  // Helper function to get the parent directory
  const getParentDirectory = (path: string) => {
    const parts = path.split("/");
    parts.pop(); // Remove the last part (current directory)
    return parts.join("/") || "/"; // Ensure root ("/") if at the top level
  };

  const handleGoUp = () => {
    const parentPath = getParentDirectory(filePath);
    setFilePath(parentPath);
  };

  const isSelected = (node: any) => {
    const fullPath = `${filePath}/${node.name}`.replace(/\/+/g, "/"); // Construct full path
    return selectedItems.has(fullPath);
  };

  return (
    <div ref={fileManagerRef}>
      <div className="flex items-center space-x-2 min-h-10">
        {/* Go Up button */}
        <button
          onClick={handleGoUp}
          className="size-8 flex items-center justify-center rounded hover:bg-gray-200"
          title="Go Up"
        >
          <LucideArrowUp className="size-4" />
        </button>

        {/* File Path Input */}
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          // placeholder="Enter file path (e.g., /documents/notes.txt)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setFilePath(filePath); // This will trigger the effect and reload the directory
            }
          }}
          className="flex-1 p-2 h-8 border border-transparent hover:border-gray-300 rounded"
        />
      </div>
      <div className="py-4">
        {directoryNodes.map((node, index) => (
          <DirectoryEntry
            key={node.name}
            name={node.name}
            icon={node.isDirectory ? <LucideFolder /> : <LucideFile />}
            isSelected={isSelected(node)} // Check selection based on full path
            onClick={(e) => toggleSelection(node.name, index, e)}
            onDoubleClick={() => handleDoubleClick(node)} // Add double click handler
          />
        ))}
      </div>
      <AssistantPopUp
        lastClickedIndex={currentClickIndex}
        selectedFiles={selectedItems}
      />
    </div>
  );
};

const DirectoryEntry = ({
  name,
  icon,
  isSelected,
  onClick,
  onDoubleClick,
}: {
  name: string;
  icon: React.JSX.Element;
  isSelected: boolean;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        isSelected ? "bg-zinc-100 text-zinc-950" : "text-zinc-800",
        "flex flex-row items-center gap-1 w-full h-8 px-2"
      )}
    >
      {React.cloneElement(icon, { className: "size-4" })} {name}
    </button>
  );
};
