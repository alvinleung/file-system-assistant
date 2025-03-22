type FileContent = string | Buffer;

export interface VFSNode {
  name: string;
  isDirectory: boolean;
}

export class FileNode implements VFSNode {
  name: string;
  isDirectory: boolean = false;
  content: FileContent;

  constructor(name: string, content: FileContent = "") {
    this.name = name;
    this.content = content;
  }
}

export class DirectoryNode implements VFSNode {
  name: string;
  isDirectory: boolean = true;
  children: Map<string, VFSNode> = new Map();

  public map<T>(callback: (node: VFSNode, index: number) => T): T[] {
    const results: T[] = [];
    let index = 0;
    this.children.forEach((node) => {
      results.push(callback(node, index));
      index++;
    });
    return results;
  }

  constructor(name: string) {
    this.name = name;
  }
}

export function isDirectoryNode(node: VFSNode): node is DirectoryNode {
  return node.isDirectory === true;
}

export class VirtualFileSystem {
  private root: DirectoryNode = new DirectoryNode("");

  public setRootDirectory(rootNode: DirectoryNode): void {
    if (!rootNode.isDirectory) {
      throw new Error("The root node must be a directory.");
    }
    this.root = rootNode;
  }

  /**
   * Checks if the given path is a directory.
   * @param path Path to check (e.g., "/folder/subfolder")
   * @returns True if the path is a directory, false otherwise.
   */
  public isDirectory(path: string): boolean {
    const { node } = this.resolve(path);
    if (!node) {
      throw new Error(`Path "${path}" does not exist.`);
    }
    return node.isDirectory;
  }

  /**
   * Resolves the path into a node and its parent directory.
   * @param path Path to resolve (e.g., "/folder/subfolder/file.txt")
   */
  private resolve(path: string): {
    parent: DirectoryNode;
    name: string;
    node?: VFSNode;
  } {
    // Remove any extra slashes and split path into parts.
    const parts = path.split("/").filter(Boolean);
    let current: DirectoryNode = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const child = current.children.get(part);
      if (!child || !child.isDirectory) {
        throw new Error(
          `Directory "${part}" does not exist in path "${path}".`
        );
      }
      current = child as DirectoryNode;
    }
    const name = parts[parts.length - 1] || "";
    const node = current.children.get(name);
    return { parent: current, name, node };
  }

  /**
   * Creates a directory at the given path.
   * @param path Path to create directory (e.g., "/folder/subfolder")
   */
  public createDirectory(path: string): void {
    const parts = path.split("/").filter(Boolean);
    let current: DirectoryNode = this.root;
    for (const part of parts) {
      const child = current.children.get(part);
      if (child) {
        if (!child.isDirectory) {
          throw new Error(
            `A file exists at "${part}", cannot create directory.`
          );
        }
        current = child as DirectoryNode;
      } else {
        const newDir = new DirectoryNode(part);
        current.children.set(part, newDir);
        current = newDir;
      }
    }
  }

  /**
   * Writes a file with the given content at the specified path.
   * Creates parent directories if they do not exist.
   * @param path File path (e.g., "/folder/file.txt")
   * @param content File content
   */
  public writeFile(path: string, content: FileContent): void {
    const parts = path.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) {
      throw new Error("Invalid file path.");
    }
    // Ensure the directory exists.
    let current: DirectoryNode = this.root;
    for (const part of parts) {
      let child = current.children.get(part);
      if (!child) {
        // Create directory if it doesn't exist.
        child = new DirectoryNode(part);
        current.children.set(part, child);
      }
      if (!child.isDirectory) {
        throw new Error(`"${part}" is a file, not a directory.`);
      }
      current = child as DirectoryNode;
    }
    // Write file.
    const fileNode = new FileNode(fileName, content);
    current.children.set(fileName, fileNode);
  }

  /**
   * Reads and returns the content of the file at the specified path.
   * @param path File path (e.g., "/folder/file.txt")
   */
  public readFile(path: string): FileContent {
    const { node } = this.resolve(path);
    if (!node || node.isDirectory) {
      throw new Error(`File "${path}" does not exist or is a directory.`);
    }
    return (node as FileNode).content;
  }

  /**
   * Retrieves the specified directory node.
   * @param path Directory path (e.g., "/folder")
   * @returns The DirectoryNode at the specified path.
   */
  public getDirectory(path: string): DirectoryNode {
    let dir: DirectoryNode;
    if (path === "/" || path === "") {
      dir = this.root;
    } else {
      const { node } = this.resolve(path);
      if (!node || !node.isDirectory) {
        throw new Error(`Directory "${path}" does not exist.`);
      }
      dir = node as DirectoryNode;
    }

    return dir;
  }

  /**
   * Removes a file or directory at the given path.
   * If the path is a directory, it must be empty.
   * @param path Path to remove (e.g., "/folder/file.txt" or "/folder/subfolder")
   */
  public remove(path: string): void {
    const { parent, name, node } = this.resolve(path);
    if (!node) {
      throw new Error(`Path "${path}" does not exist.`);
    }
    if (node.isDirectory) {
      const dirNode = node as DirectoryNode;
      if (dirNode.children.size > 0) {
        throw new Error(`Directory "${path}" is not empty.`);
      }
    }
    parent.children.delete(name);
  }

  /**
   * Moves a file or directory from one path to another.
   * @param sourcePath Path of the file/directory to move.
   * @param destinationPath New path for the file/directory.
   */
  public move(sourcePath: string, destinationPath: string): void {
    // Resolve the source.
    const { parent: sourceParent, name, node } = this.resolve(sourcePath);
    if (!node) {
      throw new Error(`Source path "${sourcePath}" does not exist.`);
    }
    // Remove from the source parent.
    sourceParent.children.delete(name);

    // Resolve destination parent.
    const destParts = destinationPath.split("/").filter(Boolean);
    const destName = destParts.pop();
    if (!destName) {
      throw new Error("Invalid destination path.");
    }
    let destDir: DirectoryNode = this.root;
    for (const part of destParts) {
      let child = destDir.children.get(part);
      if (!child) {
        child = new DirectoryNode(part);
        destDir.children.set(part, child);
      }
      if (!child.isDirectory) {
        throw new Error(`"${part}" in destination path is not a directory.`);
      }
      destDir = child as DirectoryNode;
    }
    node.name = destName;
    destDir.children.set(destName, node);
  }
}
