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
import type { ParsedDockingData, TaggedDockingData } from "../types";

/**
 * AUTO_TAG_DOCKING_RESULT Action
 * Applies rule-based tags and confidence scoring to parsed docking data
 * Deterministic classification based on binding energy and data completeness
 */
export const autoTagDockingResultAction: Action = {
  name: "AUTO_TAG_DOCKING_RESULT",
  similes: ["TAG_DOCKING", "CLASSIFY_DOCKING", "SCORE_DOCKING"],
  description:
    "Applies rule-based tags and confidence scoring to parsed docking data based on binding energy ranges and data completeness",

  validate: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<boolean> => {
    // This action is typically called after PARSE_DOCKING_FILE
    return true;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info("Handling AUTO_TAG_DOCKING_RESULT action");

      await callback({
        text: "Applying tags and confidence scoring...",
        actions: ["AUTO_TAG_DOCKING_RESULT"],
        source: message.content.source,
      });

      // Get parsed data from previous action or options
      const context = options?.context;
      const previousResult = context?.getPreviousResult?.("PARSE_DOCKING_FILE");
      const parsedData: ParsedDockingData | undefined =
        previousResult?.data || options?.parsedData;

      if (!parsedData) {
        return {
          text: "No parsed docking data found. Please run PARSE_DOCKING_FILE first.",
          success: false,
          error: new Error("MISSING_PARSED_DATA"),
        };
      }

      // Apply rule-based tagging
      const taggedData = applyTags(parsedData);

      const responseContent: Content = {
        text: `✓ Tagged: ${taggedData.tags.join(", ")} | Confidence: ${(taggedData.confidence * 100).toFixed(0)}%`,
        actions: ["AUTO_TAG_DOCKING_RESULT"],
        source: message.content.source,
      };

      await callback(responseContent);

      return {
        text: "Docking result tagged successfully",
        values: {
          success: true,
          tagged: true,
          confidence: taggedData.confidence,
        },
        data: taggedData,
        success: true,
      };
    } catch (error) {
      logger.error({ error }, "Error in AUTO_TAG_DOCKING_RESULT action:");

      return {
        text: `Failed to tag docking result: ${error instanceof Error ? error.message : String(error)}`,
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
          text: "Tag this docking result",
        },
      },
      {
        name: "NeuraVault",
        content: {
          text: "Applied tags: strong_binder, high_confidence. Confidence: 95%",
          actions: ["AUTO_TAG_DOCKING_RESULT"],
        },
      },
    ],
  ],
};

/**
 * Apply rule-based tags to parsed docking data
 */
function applyTags(data: ParsedDockingData): TaggedDockingData {
  const tags: string[] = [];
  let confidence = 0;

  // Tag based on binding energy (kcal/mol)
  const energy = data.binding_energy;

  if (energy < -10) {
    tags.push("very_strong_binder");
  } else if (energy < -8) {
    tags.push("strong_binder");
  } else if (energy < -6) {
    tags.push("moderate_binder");
  } else if (energy < -4) {
    tags.push("weak_binder");
  } else {
    tags.push("very_weak_binder");
  }

  // Tag based on docking tool
  tags.push(`tool_${data.docking_tool.toLowerCase().replace(/\s+/g, "_")}`);

  // Tag based on data completeness
  if (data.protein !== "UNKNOWN" && data.protein !== "GENERIC_PROTEIN") {
    tags.push("protein_identified");
  } else {
    tags.push("protein_unknown");
  }

  if (data.ligand !== "UNKNOWN" && data.ligand !== "GENERIC_LIGAND") {
    tags.push("ligand_identified");
  } else {
    tags.push("ligand_unknown");
  }

  // Calculate confidence score (0-1)
  confidence = calculateConfidence(data);

  return {
    ...data,
    tags,
    confidence,
  };
}

/**
 * Calculate confidence score based on data completeness and validity
 */
function calculateConfidence(data: ParsedDockingData): number {
  let score = 0;

  // Protein identified: +0.3
  if (data.protein !== "UNKNOWN" && data.protein !== "GENERIC_PROTEIN") {
    score += 0.3;
  }

  // Ligand identified: +0.3
  if (data.ligand !== "UNKNOWN" && data.ligand !== "GENERIC_LIGAND") {
    score += 0.3;
  }

  // Valid binding energy: +0.2
  if (data.binding_energy !== 0 && data.binding_energy < 0) {
    score += 0.2;
  }

  // Known docking tool: +0.2
  if (data.docking_tool !== "Unknown") {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

/**
 * Get human-readable energy classification
 */
function getEnergyClassification(energy: number): string {
  if (energy < -10) return "Very Strong Binding";
  if (energy < -8) return "Strong Binding";
  if (energy < -6) return "Moderate Binding";
  if (energy < -4) return "Weak Binding";
  return "Very Weak Binding";
}
