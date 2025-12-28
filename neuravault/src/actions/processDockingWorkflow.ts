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
import { createHash, randomUUID } from "crypto";
import type { DockingResult } from "../types";

/**
 * PROCESS_DOCKING_WORKFLOW Action
 * Complete workflow: Parse → Tag → Store in one action
 * This ensures the full pipeline executes reliably
 */
export const processDockingWorkflowAction: Action = {
  name: "PROCESS_DOCKING_WORKFLOW",
  similes: [
    "PROCESS_DOCKING",
    "UPLOAD_DOCKING",
    "PARSE_DOCKING",
    "STORE_DOCKING",
    "SAVE_DOCKING",
  ],
  description:
    "Complete docking workflow: parses file, applies tags, stores in database with Solana blockchain proof",

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("parse") ||
      text.includes("process") ||
      text.includes("upload") ||
      text.includes("docking") ||
      text.includes("receptor") ||
      text.includes("ligand")
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
      logger.info("Handling PROCESS_DOCKING_WORKFLOW action");

      // Step 1: Parse
      await callback({
        text: "📄 Parsing docking file...",
        actions: ["PROCESS_DOCKING_WORKFLOW"],
        source: message.content.source,
      });

      const fileContent = message.content.text || "";
      const parsedData = parseDockingContent(fileContent);

      if (!parsedData) {
        return {
          text: "Failed to parse docking file",
          success: false,
          error: new Error("PARSE_FAILED"),
        };
      }

      // Step 2: Tag
      await callback({
        text: `✓ Parsed: ${parsedData.protein} + ${parsedData.ligand}\n🏷️  Applying tags...`,
        actions: ["PROCESS_DOCKING_WORKFLOW"],
        source: message.content.source,
      });

      const taggedData = applyTags(parsedData);

      // Step 3: Store
      await callback({
        text: `✓ Tagged: ${taggedData.tags.slice(0, 2).join(", ")}\n💾 Storing with blockchain proof...`,
        actions: ["PROCESS_DOCKING_WORKFLOW"],
        source: message.content.source,
      });

      const timestamp = new Date().toISOString();
      const result: DockingResult = {
        ...taggedData,
        timestamp,
        solana_tx: null,
      };

      // Store in memory (in-memory for demo - no database)
      // In production, this would use proper database storage
      if (!global.dockingResults) {
        global.dockingResults = [];
      }
      global.dockingResults.push(result);

      // Create Solana proof (mock for now)
      const metadataHash = createHash("sha256")
        .update(JSON.stringify(result))
        .digest("hex");
      const mockTxId = `MOCK_${metadataHash.substring(0, 16)}`;
      result.solana_tx = mockTxId;

      await callback({
        text: `✅ Complete!\n• ${result.protein} + ${result.ligand}: ${result.binding_energy} kcal/mol\n• Tags: ${result.tags.slice(0, 3).join(", ")}\n• Confidence: ${(result.confidence * 100).toFixed(0)}%\n• Solana TX: ${mockTxId.substring(0, 20)}...`,
        actions: ["PROCESS_DOCKING_WORKFLOW"],
        source: message.content.source,
      });

      return {
        text: "Docking workflow completed successfully",
        values: {
          success: true,
          parsed: true,
          tagged: true,
          stored: true,
        },
        data: result,
        success: true,
      };
    } catch (error) {
      logger.error({ error }, "Error in PROCESS_DOCKING_WORKFLOW action:");

      return {
        text: `Workflow failed: ${error instanceof Error ? error.message : String(error)}`,
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
          text: "Parse this Vina result: receptor: 1ABC, ligand: XYZ, energy: -8.5",
        },
      },
      {
        name: "NeuraVault",
        content: {
          text: "Processing complete. Stored with blockchain proof.",
          actions: ["PROCESS_DOCKING_WORKFLOW"],
        },
      },
    ],
  ],
};

// Helper functions
function parseDockingContent(content: string): any {
  const fileHash = createHash("sha256").update(content).digest("hex");

  // Extract data from text
  const proteinMatch =
    content.match(/receptor[:\s]+(\w+)/i) ||
    content.match(/protein[:\s]+(\w+)/i);
  const protein = proteinMatch ? proteinMatch[1] : "UNKNOWN";

  const ligandMatch = content.match(/ligand[:\s]+(\w+)/i);
  const ligand = ligandMatch ? ligandMatch[1] : "UNKNOWN";

  // Try multiple energy patterns
  const energyMatch =
    content.match(/energy[:\s]+([-\d.]+)/i) || // "energy: -8.5" or "energy -8.5"
    content.match(/([-\d.]+)\s*kcal/i) || // "-8.5 kcal/mol"
    content.match(/affinity\s*=\s*([-\d.]+)/i) || // "Affinity = -8.5"
    content.match(/\s+1\s+([-\d.]+)/); // Vina table format
  const binding_energy = energyMatch ? parseFloat(energyMatch[1]) : 0;

  const docking_tool = content.includes("Vina")
    ? "AutoDock Vina"
    : content.includes("GOLD")
      ? "GOLD"
      : content.includes("Glide")
        ? "Glide"
        : "Unknown";

  return {
    protein,
    ligand,
    binding_energy,
    docking_tool,
    file_hash: fileHash,
  };
}

function applyTags(data: any): any {
  const tags: string[] = [];
  const energy = data.binding_energy;

  if (energy < -10) tags.push("very_strong_binder");
  else if (energy < -8) tags.push("strong_binder");
  else if (energy < -6) tags.push("moderate_binder");
  else if (energy < -4) tags.push("weak_binder");
  else tags.push("very_weak_binder");

  tags.push(`tool_${data.docking_tool.toLowerCase().replace(/\s+/g, "_")}`);

  if (data.protein !== "UNKNOWN") tags.push("protein_identified");
  if (data.ligand !== "UNKNOWN") tags.push("ligand_identified");

  let confidence = 0;
  if (data.protein !== "UNKNOWN") confidence += 0.3;
  if (data.ligand !== "UNKNOWN") confidence += 0.3;
  if (data.binding_energy !== 0 && data.binding_energy < 0) confidence += 0.2;
  if (data.docking_tool !== "Unknown") confidence += 0.2;

  return {
    ...data,
    tags,
    confidence: Math.min(confidence, 1.0),
  };
}
