import type { Plugin } from "@elizaos/core";
import {
  type Action,
  type ActionResult,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  type RouteRequest,
  type RouteResponse,
  Service,
  type State,
  logger,
} from "@elizaos/core";
import { z } from "zod";
import {
  parseDockingFileAction,
  autoTagDockingResultAction,
  storeMetadataAction,
  queryDockingDataAction,
} from "./actions";

/**
 * Define the configuration schema for NeuraVault plugin
 */
const configSchema = z.object({
  SOLANA_RPC_URL: z
    .string()
    .url()
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn(
          "Warning: SOLANA_RPC_URL not provided. Blockchain proofs will be disabled."
        );
      }
      return val;
    }),
  SOLANA_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn(
          "Warning: SOLANA_PRIVATE_KEY not provided. Blockchain proofs will be disabled."
        );
      }
      return val;
    }),
});

const plugin: Plugin = {
  name: "neuravault",
  description:
    "NeuraVault - Data management plugin for molecular docking results",
  priority: 100,
  config: {
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
  },
  async init(config: Record<string, string>) {
    logger.info("*** Initializing NeuraVault plugin ***");
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }

      logger.info("NeuraVault plugin initialized successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages =
          error.issues?.map((e) => e.message)?.join(", ") ||
          "Unknown validation error";
        throw new Error(`Invalid plugin configuration: ${errorMessages}`);
      }
      throw new Error(
        `Invalid plugin configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  services: [],
  actions: [
    parseDockingFileAction,
    autoTagDockingResultAction,
    storeMetadataAction,
    queryDockingDataAction,
  ],
  providers: [],
};

export default plugin;
