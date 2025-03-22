import { NextResponse } from "next/server";
import { sendLogToAdaline } from "@/app/api/adaline/adaline";

export async function POST(req: Request) {
  try {
    const logData = await req.json(); // Parse the request body as JSON

    // Validate the logData object
    if (
      !logData.projectId ||
      !logData.provider ||
      !logData.model ||
      !logData.completion
    ) {
      return NextResponse.json(
        { error: "Missing required fields in log data" },
        { status: 400 }
      );
    }

    // Send the log data to Adaline
    const result = await sendLogToAdaline(logData);

    if (result === undefined) {
      return NextResponse.json(
        { error: "Failed to send log to Adaline" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Log sent successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
