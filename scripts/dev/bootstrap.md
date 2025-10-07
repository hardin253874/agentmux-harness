# Agentmux Local Smoke Harness (Temporary)

This harness simulates the missing `pnpm agentmux tasks ls/seed/worker` subcommands so you can verify multi‑agent chaining today.

## Prereqs
- Node.js 20+
- `pnpm add -g better-sqlite3 yaml` **or** install locally
- PowerShell 7+ on Windows (or adapt the ps1 lines to Bash scripts)

## Install deps (local)
```bash
cd <this-folder>
npm i better-sqlite3 yaml
```

## Seed DAG
```bash
node scripts/dev/seed-dag.mjs
```

## Run three workers (each in its own terminal)
```bash
node scripts/dev/worker.mjs gemini
node scripts/dev/worker.mjs codex
node scripts/dev/worker.mjs claude
```

## Observe
```bash
type artifacts/text/test.txt   # Windows
# or: cat artifacts/text/test.txt
```

Expected:
```
Gemini line: 1234
Codex line: 5678
Claude line: 9012
```

Events live in `state/tasks.db` (SQLite) and `state/`.
When your official CLI subcommands are ready, replace this harness with:
```
pnpm agentmux tasks seed agentmux/dag.yaml
pnpm agentmux worker --agent gemini --worker-id gemini-1
...
```