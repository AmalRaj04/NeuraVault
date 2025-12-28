import type {
  Action,
  ActionResult,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
} from "@elizaos/core";
import { logger } from "@elizaos/core";
import type { DockingResult } from "../types";

/**
 * QUERY_DOCKING_DATA Action
 * Queries stored docking data using natural language
 * Supports filtering by protein, ligand, energy range, tags, and tool
 */
export const queryDockingDataAction: Action = {
  name: "QUERY_DOCKING_DATA",
  similes: [
    "SEARCH_DOCKING",
    "FIND_DOCKING",
    "GET_DOCKING",
    "RETRIEVE_DOCKING",
  ],
  description:
    "Queries stored docking data using natural language. Supports filtering by protein, ligand, binding energy range, tags, and docking tool",

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("query") ||
      text.includes("search") ||
      text.includes("find") ||
      text.includes("show") ||
      text.includes("get") ||
      text.includes("retrieve") ||
      text.includes("list")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info("Handling QUERY_DOCKING_DATA action");

      await callback({
        text: "Querying docking database...",
        actions: ["QUERY_DOCKING_DATA"],
        source: message.content.source,
      });

      // Parse query from message
      const queryText = message.content.text || "";
      const filters = parseQueryFilters(queryText);

      logger.info({ filters }, "Parsed query filters");

      // Query database
      const results = await queryDatabase(runtime, filters);

      if (results.length === 0) {
        const responseContent: Content = {
          text: "No docking results found matching your query.",
          actions: ["QUERY_DOCKING_DATA"],
          source: message.content.source,
        };

        await callback(responseContent);

        return {
          text: "No results found",
          values: {
            success: true,
            count: 0,
          },
          data: { results: [] },
          success: true,
        };
      }

      // Format results
      const formattedResults = formatResults(results);

      const responseContent: Content = {
        text: `Found ${results.length} docking result(s):\n\n${formattedResults}`,
        actions: ["QUERY_DOCKING_DATA"],
        source: message.content.source,
      };

      await callback(responseContent);

      return {
        text: `Found ${results.length} docking results`,
        values: {
          success: true,
          count: results.length,
        },
        data: { results },
        success: true,
      };
    } catch (error) {
      logger.error({ error }, "Error in QUERY_DOCKING_DATA action:");

      return {
        text: `Failed to query docking data: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Show me all docking results for protein 1ABC",
        },
      },
      {
        name: "NeuraVault",
        content: {
          text: "Found 3 results for protein 1ABC...",
          actions: ["QUERY_DOCKING_DATA"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "Find strong binders with energy below -8.0",
        },
      },
      {
        name: "NeuraVault",
        content: {
          text: "Found 5 strong binders with binding energy < -8.0 kcal/mol...",
          actions: ["QUERY_DOCKING_DATA"],
        },
      },
    ],
  ],
};

/**
 * Query filter interface
 */
interface QueryFilters {
  protein?: string;
  ligand?: string;
  minEnergy?: number;
  maxEnergy?: number;
  tool?: string;
  tags?: string[];
}

/**
 * Parse natural language query into structured filters
 */
function parseQueryFilters(queryText: string): QueryFilters {
  const filters: QueryFilters = {};
  const lowerQuery = queryText.toLowerCase();

  // Extract protein name
  const proteinMatch = lowerQuery.match(/protein\s+(\w+)/i);
  if (proteinMatch) {
    filters.protein = proteinMatch[1].toUpperCase();
  }

  // Extract ligand name
  const ligandMatch = lowerQuery.match(/ligand\s+(\w+)/i);
  if (ligandMatch) {
    filters.ligand = ligandMatch[1].toUpperCase();
  }

  // Extract energy range
  const belowMatch = lowerQuery.match(/below\s+([-\d.]+)/);
  const aboveMatch = lowerQuery.match(/above\s+([-\d.]+)/);
  const lessThanMatch = lowerQuery.match(/(?:less than|<)\s*([-\d.]+)/);
  const greaterThanMatch = lowerQuery.match(/(?:greater than|>)\s*([-\d.]+)/);

  if (belowMatch || lessThanMatch) {
    filters.maxEnergy = parseFloat(
      belowMatch?.[1] || lessThanMatch?.[1] || "0"
    );
  }
  if (aboveMatch || greaterThanMatch) {
    filters.minEnergy = parseFloat(
      aboveMatch?.[1] || greaterThanMatch?.[1] || "0"
    );
  }

  // Extract tool name
  if (lowerQuery.includes("vina")) {
    filters.tool = "AutoDock Vina";
  } else if (lowerQuery.includes("gold")) {
    filters.tool = "GOLD";
  } else if (lowerQuery.includes("glide")) {
    filters.tool = "Glide";
  }

  // Extract tags
  const tags: string[] = [];
  if (lowerQuery.includes("strong binder")) {
    tags.push("strong_binder");
  }
  if (lowerQuery.includes("weak binder")) {
    tags.push("weak_binder");
  }
  if (lowerQuery.includes("moderate binder")) {
    tags.push("moderate_binder");
  }
  if (tags.length > 0) {
    filters.tags = tags;
  }

  return filters;
}

/**
 * Query database with filters
 */
async function queryDatabase(
  runtime: IAgentRuntime,
  filters: QueryFilters
): Promise<DockingResult[]> {
  try {
    // Get all docking results from memory
    const memories = await runtime.getMemories({
      tableName: "memories",
      roomId: runtime.agentId,
      count: 100,
    });

    // Filter memories that contain docking results
    const dockingMemories = memories.filter(
      (m) =>
        m.content &&
        typeof m.content === "object" &&
        "docking_result" in m.content
    );

    // Extract docking results
    let results: DockingResult[] = dockingMemories
      .map((m) => {
        const content = m.content as any;
        return content.docking_result as DockingResult;
      })
      .filter((r) => r !== null && r !== undefined);

    // Apply filters
    if (filters.protein) {
      results = results.filter((r) =>
        r.protein.toUpperCase().includes(filters.protein!.toUpperCase())
      );
    }

    if (filters.ligand) {
      results = results.filter((r) =>
        r.ligand.toUpperCase().includes(filters.ligand!.toUpperCase())
      );
    }

    if (filters.minEnergy !== undefined) {
      results = results.filter((r) => r.binding_energy >= filters.minEnergy!);
    }

    if (filters.maxEnergy !== undefined) {
      results = results.filter((r) => r.binding_energy <= filters.maxEnergy!);
    }

    if (filters.tool) {
      results = results.filter((r) =>
        r.docking_tool.toLowerCase().includes(filters.tool!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((r) =>
        filters.tags!.some((tag) => r.tags.includes(tag))
      );
    }

    logger.info({ count: results.length }, "Query returned results");

    return results;
  } catch (error) {
    logger.error({ error }, "Error querying database");
    return [];
  }
}

/**
 * Format results for display
 */
function formatResults(results: DockingResult[]): string {
  return results
    .map((r, index) => {
      return `${index + 1}. ${r.protein} + ${r.ligand}
   - Binding Energy: ${r.binding_energy} kcal/mol
   - Tool: ${r.docking_tool}
   - Tags: ${r.tags.join(", ")}
   - Confidence: ${(r.confidence * 100).toFixed(1)}%
   - Solana TX: ${r.solana_tx || "N/A"}`;
    })
    .join("\n\n");
}
