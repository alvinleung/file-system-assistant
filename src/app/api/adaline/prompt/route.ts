import { NextResponse } from "next/server"; // Import NextResponse
import { getAdalinePrompt } from "@/app/api/adaline/adaline"; // Import getAdalinePrompt

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url); // Get query parameters
  const projectId = searchParams.get("projectId"); // Extract projectId

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId in query parameters" },
      { status: 400 }
    );
  }

  try {
    const prompt = await getAdalinePrompt(projectId); // Use getAdalinePrompt

    if (!prompt) {
      return NextResponse.json(
        { error: "Failed to retrieve prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt }); // Return the prompt in the response
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error fetching data from Adaline" },
      { status: 500 }
    );
  }
}
