import { DirectoryNode, FileNode, VFSNode } from "./VirtualFileSystem";

export type SerializedVFSNode = {
  name: string;
  isDirectory: boolean;
  // File content is stored as a string (Buffer content is converted to a string)
  content?: string;
  // For directories, children are an array of SerializedVFSNode objects.
  children?: SerializedVFSNode[];
};
/**
 * Recursively serializes a VFS node into a JSON-friendly object.
 * @param node A file or directory node.
 * @returns The serialized representation.
 */
export function serializeNode(node: VFSNode): SerializedVFSNode {
  if (node.isDirectory) {
    const dir = node as DirectoryNode;
    return {
      name: dir.name,
      isDirectory: true,
      children: Array.from(dir.children.values()).map(serializeNode),
    };
  } else {
    const file = node as FileNode;
    return {
      name: file.name,
      isDirectory: false,
      content: file.content.toString(),
    };
  }
}

/**
 * Recursively deserializes a SerializedVFSNode back into a VFS node.
 * @param serialized The serialized node.
 * @returns The reconstructed VFS node.
 */
export function deserializeNode(serialized: SerializedVFSNode): VFSNode {
  if (serialized.isDirectory) {
    const dir = new DirectoryNode(serialized.name);
    if (serialized.children) {
      for (const child of serialized.children) {
        dir.children.set(child.name, deserializeNode(child));
      }
    }
    return dir;
  } else {
    return new FileNode(serialized.name, serialized.content || "");
  }
}
