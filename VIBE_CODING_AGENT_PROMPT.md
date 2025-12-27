You are operating in STRICT EXECUTION MODE.

You are building an ElizaOS-based AI agent for managing molecular docking simulation data.

You MUST follow the provided PROJECT_CONTEXT.md, RULES.md, ARCHITECTURE.md, and TECHSTACK.md exactly.

You must NOT:

- Add new features
- Invent biological interpretations
- Change the data schema
- Introduce additional agents
- Add optimizations not requested

## Your Task

Implement the project incrementally in the following order:

1. Create an ElizaOS project scaffold
2. Define the agent character with a strict system prompt
3. Implement the following actions as Eliza tools:
   - parseDockingFile
   - autoTagDockingResult
   - storeMetadata
   - queryDockingData
4. Ensure tool calling order is enforced
5. Integrate Solana hash storage in storeMetadata
6. Provide a minimal interface to trigger uploads and queries

## Implementation Rules

- Each action must be deterministic
- Each function must have explicit input/output types
- No hidden state
- No speculative logic
- All data must be persisted or returned

## Output Format

- Generate clean TypeScript files
- Follow ElizaOS conventions
- No explanations unless explicitly requested
- No creative deviations

Acknowledge the task and begin with step 1 only.
