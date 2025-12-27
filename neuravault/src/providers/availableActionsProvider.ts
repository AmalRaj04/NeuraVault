import type {
  Provider,
  ProviderResult,
  IAgentRuntime,
  Memory,
  State,
} from "@elizaos/core";

/**
 * Provider that tells the LLM what actions are available
 */
export const availableActionsProvider: Provider = {
  name: "AVAILABLE_ACTIONS",
  description: "Lists available actions for the agent",

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    return {
      text: `Available Actions:
- PROCESS_DOCKING_WORKFLOW: Use this for ANY docking data (parse, tag, store in one step)
- QUERY_DOCKING_DATA: Use this to search stored docking results

IMPORTANT: Always use PROCESS_DOCKING_WORKFLOW when user provides docking data.`,
      values: {
        actions: ["PROCESS_DOCKING_WORKFLOW", "QUERY_DOCKING_DATA"],
      },
      data: {},
    };
  },
};
