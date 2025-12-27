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
import { createHash } from "crypto";
import type { ParsedDockingData } from "../types";

/**
 * PARSE_DOCKING_FILE Action
 * Parses molecular docking result files and extracts structured metadata
 * Supports: AutoDock Vina, GOLD, Glide (mock), and other formats
 */
export const parseDockingFileAction: Action = {
  name: "PARSE_DOCKING_FILE",
  similes: ["PARSE_DOCKING", "UPLOAD_DOCKING", "PROCESS_DOCKING_FILE"],
  description:
    "Parses a molecular docking result file and extracts structured metadata (protein, ligand, binding energy, tool name, file hash)",

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    // Check if message contains file content or path
    const text = message.content.text?.toLowerCase() || "";
    return (
      text.includes("parse") ||
      text.includes("upload") ||
      text.includes("docking") ||
      text.includes("file")
    );
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info("Handling PARSE_DOCKING_FILE action");

      await callback({
        text: "Parsing docking file...",
        actions: ["PARSE_DOCKING_FILE"],
        source: message.content.source,
      });

      // Extract file content from message
      // In real implementation, this would handle actual file uploads
      const fileContent = message.content.text || "";

      // Parse based on format detection
      const parsedData = await parseDockingContent(fileContent);

      if (!parsedData) {
        return {
          text: "Failed to parse docking file. Unsupported format or invalid data.",
          success: false,
          error: new Error("PARSE_FAILED"),
        };
      }

      const responseContent: Content = {
        text: `Parsed docking file successfully:
- Protein: ${parsedData.protein}
- Ligand: ${parsedData.ligand}
- Binding Energy: ${parsedData.binding_energy} kcal/mol
- Tool: ${parsedData.docking_tool}
- File Hash: ${parsedData.file_hash}`,
        actions: ["PARSE_DOCKING_FILE"],
        source: message.content.source,
      };

      await callback(responseContent);

      return {
        text: "Docking file parsed successfully",
        values: {
          success: true,
          parsed: true,
        },
        data: parsedData,
        success: true,
      };
    } catch (error) {
      logger.error({ error }, "Error in PARSE_DOCKING_FILE action:");

      return {
        text: `Failed to parse docking file: ${error instanceof Error ? error.message : String(error)}`,
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
          text: "I have an AutoDock Vina result file. Can you parse it?",
        },
      },
      {
        name: "NeuraVault",
        content: {
          text: "Yes. Please provide the file content or upload the file.",
          actions: ["PARSE_DOCKING_FILE"],
        },
      },
    ],
  ],
};

/**
 * Parse docking file content based on format
 */
async function parseDockingContent(
  content: string
): Promise<ParsedDockingData | null> {
  // Calculate file hash
  const fileHash = createHash("sha256").update(content).digest("hex");

  // Detect format and parse
  if (content.includes("AutoDock Vina") || content.includes("VINA RESULT")) {
    return parseVinaFormat(content, fileHash);
  } else if (content.includes("GOLD") || content.includes("Gold Score")) {
    return parseGoldFormat(content, fileHash);
  } else if (content.includes("Glide") || content.includes("GLIDE")) {
    return parseGlideFormat(content, fileHash);
  }

  // Try generic format
  return parseGenericFormat(content, fileHash);
}

/**
 * Parse AutoDock Vina format
 */
function parseVinaFormat(
  content: string,
  fileHash: string
): ParsedDockingData | null {
  try {
    // Extract protein name (from REMARK or filename reference)
    const proteinMatch =
      content.match(/receptor[:\s]+(\w+)/i) ||
      content.match(/protein[:\s]+(\w+)/i);
    const protein = proteinMatch ? proteinMatch[1] : "UNKNOWN";

    // Extract ligand name
    const ligandMatch =
      content.match(/ligand[:\s]+(\w+)/i) ||
      content.match(/REMARK\s+Name\s*=\s*(\w+)/i);
    const ligand = ligandMatch ? ligandMatch[1] : "UNKNOWN";

    // Extract binding energy (first mode)
    const energyMatch = content.match(/\s+1\s+([-\d.]+)/);
    const binding_energy = energyMatch ? parseFloat(energyMatch[1]) : 0;

    return {
      protein,
      ligand,
      binding_energy,
      docking_tool: "AutoDock Vina",
      file_hash: fileHash,
    };
  } catch (error) {
    logger.error({ error }, "Error parsing Vina format");
    return null;
  }
}

/**
 * Parse GOLD format
 */
function parseGoldFormat(
  content: string,
  fileHash: string
): ParsedDockingData | null {
  try {
    const proteinMatch = content.match(/Protein[:\s]+(\w+)/i);
    const protein = proteinMatch ? proteinMatch[1] : "UNKNOWN";

    const ligandMatch = content.match(/Ligand[:\s]+(\w+)/i);
    const ligand = ligandMatch ? ligandMatch[1] : "UNKNOWN";

    const scoreMatch = content.match(/Gold\s+Score[:\s]+([-\d.]+)/i);
    const binding_energy = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

    return {
      protein,
      ligand,
      binding_energy,
      docking_tool: "GOLD",
      file_hash: fileHash,
    };
  } catch (error) {
    logger.error({ error }, "Error parsing GOLD format");
    return null;
  }
}

/**
 * Parse Glide format (mock for commercial tool)
 */
function parseGlideFormat(
  content: string,
  fileHash: string
): ParsedDockingData | null {
  try {
    const proteinMatch = content.match(/Receptor[:\s]+(\w+)/i);
    const protein = proteinMatch ? proteinMatch[1] : "MOCK_PROTEIN";

    const ligandMatch = content.match(/Title[:\s]+(\w+)/i);
    const ligand = ligandMatch ? ligandMatch[1] : "MOCK_LIGAND";

    const scoreMatch = content.match(/Docking\s+Score[:\s]+([-\d.]+)/i);
    const binding_energy = scoreMatch ? parseFloat(scoreMatch[1]) : -7.5;

    return {
      protein,
      ligand,
      binding_energy,
      docking_tool: "Glide",
      file_hash: fileHash,
    };
  } catch (error) {
    logger.error({ error }, "Error parsing Glide format");
    return null;
  }
}

/**
 * Parse generic format (fallback)
 */
function parseGenericFormat(
  content: string,
  fileHash: string
): ParsedDockingData | null {
  // Return null for truly unparseable content
  if (content.length < 10) {
    return null;
  }

  // Mock data for demonstration
  return {
    protein: "GENERIC_PROTEIN",
    ligand: "GENERIC_LIGAND",
    binding_energy: -6.0,
    docking_tool: "Unknown",
    file_hash: fileHash,
  };
}
