export type AdalineTool = {
  function: string;
  type: string;
  schema: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<
        string,
        {
          type: string;
          description: string;
        }
      >;
      required: string[];
    };
  };
};

export type AdalineMessage = {
  role: "assistant" | "user" | "system";
  content: Array<{
    modality: string;
    value: string;
  }>;
};

export type AdalineVariable = {
  name: string;
  value: {
    modality: string;
    value: string;
  };
};

export type AdalinePromptType = {
  config: {
    provider: string;
    model: string;
    settings: Record<string, unknown>;
  };
  messages: Array<AdalineMessage>;
  tools: Array<AdalineTool>;
  variables: Array<AdalineVariable>;
};
