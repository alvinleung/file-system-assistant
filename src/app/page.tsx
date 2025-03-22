"use client";

import { FileManager } from "@/components/virtual-file-system/file-manager";
import DEMO_FILES_JSON from "../data/demo-project.json";

export default function Home() {
  return (
    <div className="mx-auto max-w-[700px] px-4 flex flex-col py-12">
      <div className="w-full">
        <FileManager initial={DEMO_FILES_JSON} />
      </div>
    </div>
  );
}
