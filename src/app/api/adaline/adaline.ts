// Load environment variables from the .env file
const ADALINE_TOKEN = process.env.ADALINE_TOKEN || "";

const cachedPrompts: { [key: string]: string } = {};

export async function getAdalinePrompt(projectId: string): Promise<string> {
  if (cachedPrompts[projectId]) {
    return cachedPrompts[projectId];
  }
  try {
    const response = await fetch(
      `https://api.adaline.ai/v1/deployments/${projectId}/current`,
      {
        headers: {
          Authorization: `Bearer ${ADALINE_TOKEN}`, // Use environment variable
        },
      }
    );

    if (!response.ok) {
      throw new Error("network response was not ok");
    }

    const promptProject = await response.json(); // Parse the response
    // const prompt = promptProject.messages[0].content[0].value; // Extract prompt

    // save to cached list
    cachedPrompts[projectId] = promptProject;

    return promptProject;
  } catch (error) {
    console.log(error);
    return "";
  }
}

interface LogData {
  projectId: string;
  provider: string;
  model: string;
  completion: string;
  cost?: string;
  latency?: number;
  inputTokens?: string;
  outputTokens?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, string>;
  referenceId?: string;
}

export async function sendLogToAdaline(
  logData: LogData
): Promise<string | undefined> {
  const url = "https://api.adaline.ai/v1/logs";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADALINE_TOKEN}`,
  };

  const body = JSON.stringify(logData);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    // const responseData = await response.json();
    // return responseData.id; // Assuming the ID is returned in the response
  } catch (error) {
    console.error("Error sending log:", error);
    return undefined;
  }
}
