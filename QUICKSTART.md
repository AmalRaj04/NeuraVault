# NeuraVault Quick Start Guide

## What We Built

AI agent for managing molecular docking simulation data with blockchain verification.

## To Start Tomorrow

### 1. Start Ollama (Local AI)

```bash
brew services start ollama
```

### 2. Start NeuraVault Agent

```bash
cd neuravault
elizaos start
```

### 3. Open Browser

```
http://localhost:3000
```

### 4. Test Commands

**Process docking data:**

```
receptor 6XYZ ligand MOL123 energy -8.7
```

**Query stored data:**

```
show all docking results
```

## What's Implemented

✅ ElizaOS project with custom character
✅ 4 core actions (parse, tag, store, query)
✅ Unified workflow action
✅ Ollama local AI integration
✅ Mock Solana blockchain proofs
✅ Natural language interface

## Next Steps for Hackathon

1. **Real Solana Integration** - Replace mock TX with actual blockchain
2. **Sample Data** - Pre-load 5-10 realistic docking results
3. **File Upload UI** - Drag-and-drop interface
4. **Demo Script** - Prepare workflow demonstration

## Troubleshooting

**If agent doesn't respond:**

- Refresh browser page
- Check terminal for errors
- Verify Ollama is running: `ollama list`

**If port 3000 is busy:**

```bash
lsof -ti:3000 | xargs kill -9
```

## Project Structure

```
neuravault/
├── src/
│   ├── character.ts          # Agent personality
│   ├── plugin.ts              # NeuraVault plugin
│   ├── actions/               # 5 actions
│   │   ├── processDockingWorkflow.ts  # Main workflow
│   │   ├── parseDockingFile.ts
│   │   ├── autoTagDockingResult.ts
│   │   ├── storeMetadata.ts
│   │   └── queryDockingData.ts
│   ├── providers/             # Context providers
│   └── types.ts               # TypeScript types
└── .env                       # Configuration
```

## Environment Variables

```bash
USE_OLLAMA_TEXT_MODELS=true
OLLAMA_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_SERVER_URL=http://localhost:11434
SMALL_OLLAMA_MODEL=llama3.2
MEDIUM_OLLAMA_MODEL=llama3.2
LARGE_OLLAMA_MODEL=llama3.2
EMBEDDING_OLLAMA_MODEL=nomic-embed-text
```

## Git Status

All work committed. Ready to continue tomorrow.
