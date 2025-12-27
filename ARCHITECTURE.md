# System Architecture

## High-Level Components

1. User Interface

   - Upload docking result files
   - Submit natural language queries
   - View structured results

2. ElizaOS Agent (Core)

   - Interprets user intent
   - Controls execution flow
   - Calls deterministic tools
   - Maintains agent memory

3. Agent Tools

   - parseDockingFile
   - autoTagDockingResult
   - storeMetadata
   - queryDockingData

4. Storage Layer

   - SQLite / PGlite for structured metadata
   - Local or IPFS storage for raw files

5. Blockchain Layer (Solana)
   - Stores hash of structured metadata
   - Provides timestamped integrity proof

## Execution Flow

Upload Flow:
User → Agent → parseDockingFile →
autoTagDockingResult → storeMetadata →
Solana transaction → confirmation

Query Flow:
User → Agent → queryDockingData →
Database → Structured Response

## Data Schema

{
protein: string,
ligand: string,
binding_energy: number,
docking_tool: string,
tags: string[],
confidence: number,
file_hash: string,
timestamp: string,
solana_tx: string
}

## Design Philosophy

- Deterministic over intelligent
- Traceable over fast
- Simple over complete
