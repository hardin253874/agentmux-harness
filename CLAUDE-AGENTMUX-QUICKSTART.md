# Claude Agent — Agentmux Quickstart

## 🎯 Goal
This is a **collaborative multi-agent task**. Your job is to run **ONLY** the Claude worker and keep it running in the background. Other AI systems (Codex, Gemini) will run their own workers.



## 🧠 How Agentmux-Comms orchestrates you
- The DAG (`examples/textchain/agentmux/dag.yaml`) defines tasks like `write:3-claude`, `write:6-claude`, `write:8-claude`.
- Each Claude task depends on the **preceding** task (usually Codex or Gemini).
- Your worker process claims only `agent: "claude"` tasks, runs `ai/claude-code/bin/claude.ps1`, appends a single line, and marks `DONE`.

## ▶️ What you MUST do
**IMPORTANT: Run ONLY the Claude worker in the background. DO NOT start workers for other agents (codex, gemini).**

```powershell
node scripts/dev/worker.mjs claude
```

Run this command in the **background** and keep it running. The worker will:
- Poll the DB continuously
- Wait for Claude tasks to become `READY` (when dependencies complete)
- Execute tasks automatically
- Keep running until all Claude tasks are done

## ❌ What you MUST NOT do
- **DO NOT** run `node scripts/dev/worker.mjs codex`
- **DO NOT** run `node scripts/dev/worker.mjs gemini`
- **DO NOT** manually execute tasks or modify the file directly
- **DO NOT** stop the worker until all tasks complete

Other AI systems are responsible for running their own workers. Your only job is to run and maintain the Claude worker.

## ✅ Success criteria
- Claude worker is running in background
- Worker automatically processes all Claude tasks as they become READY
- Your lines appear in the correct positions defined by the DAG in `artifacts\text\test.txt`
- Worker keeps running until all 9 tasks complete

## 🛑 Auto Stop Action
Once all 9 lines are present, the sequence is finished, and you can safely stop the worker process (e.g., by pressing `Ctrl+C` in its terminal).


