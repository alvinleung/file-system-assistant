"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { isDirectoryNode, VirtualFileSystem } from "./VirtualFileSystem"; // Adjust the import path as needed
import { deserializeNode, SerializedVFSNode } from "./vfs-serialization";

interface VFSContextValue {
  vfs: VirtualFileSystem;
}

const VFSContext = createContext<VFSContextValue | undefined>(undefined);

export const VFSProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize the VirtualFileSystem once.
  const [vfs] = useState(() => new VirtualFileSystem());
  return <VFSContext.Provider value={{ vfs }}>{children}</VFSContext.Provider>;
};

export const useVFS = (initialState?: object): VirtualFileSystem => {
  const context = useContext(VFSContext);
  if (!context) {
    throw new Error("useVFS must be used within a VFSProvider");
  }
  if (initialState) {
    // Assuming the VirtualFileSystem has a method to initialize with a state
    const deserialized = deserializeNode(initialState as SerializedVFSNode);
    if (isDirectoryNode(deserialized)) {
      context.vfs.setRootDirectory(deserialized);
    }
  }
  return context.vfs;
};
