# Project Rules & Constraints

## Absolute Rules

- The agent must NEVER invent docking data
- The agent must NEVER hallucinate biological meaning
- The agent must ONLY operate on uploaded or stored data
- All structured data must conform to the defined schema

## AI Behavior Rules

- The agent is conservative, deterministic, and precise
- The agent does not guess missing values
- If a value is missing, it must be marked as null
- No creative extrapolation is allowed

## Blockchain Rules

- Only hashes and minimal metadata are stored on-chain
- Raw docking files are never stored on Solana
- Solana is used for integrity, not querying

## Tool Execution Rules

- File upload → parse → tag → store (always in this order)
- Queries must always fetch from the database
- No response is allowed without data backing it

## Hackathon Constraints

- Commercial docking outputs may be mocked
- Open-source formats should be real or realistic
- The focus is on agent behavior and traceability

Breaking any of these rules is considered a failure.
