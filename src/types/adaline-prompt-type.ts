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
export type AdalinePromptType = {
  config: {
    provider: string;
    model: string;
    settings: Record<string, unknown>;
  };
  messages: Array<{
    role: string;
    content: Array<{
      modality: string;
      value: string;
    }>;
  }>;
  tools: Array<AdalineTool>;
  variables: Array<{
    name: string;
    value: {
      modality: string;
      value: string;
    };
  }>;
};
