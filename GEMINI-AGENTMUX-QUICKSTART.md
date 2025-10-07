# Gemini Agent — Agentmux Quickstart

## 🎯 Goal
Your goal is to participate in a multi-agent sequence to collaboratively write a text file. You are **ONLY** responsible for the "Gemini" agent steps.

The sequence is defined in `examples/textchain/agentmux/dag.yaml` and involves three agents: Gemini, Codex, and Claude. In total, 9 lines will be written to the output file.

## 🧠 How Agentmux-Comms orchestrates you
- The run is defined as a series of **tasks**.
- Each task has an `agent` field. Your worker only processes tasks where `agent: "gemini"`.
- **Dependencies (`deps`)** enforce order. A task only becomes `READY` after all its `deps` are `DONE`.
- A **worker** is a simple loop that:
  1) reads `state/tasks.db`,
  2) claims the next `READY` task for **its** agent,
  3) runs the task’s `payload` (here: a shell command),
  4) marks the task `DONE`.

## ▶️ How to run your part
### 1. Run the Gemini Worker
Now, start the worker process for the Gemini agent. It will watch the database for `READY` tasks assigned to `gemini`, execute them, and then wait for more work.

```powershell
node scripts/dev/worker.mjs gemini
```

This worker will automatically perform the Gemini steps in the sequence (`write:1-gemini`, `write:4-gemini`, `write:9-gemini`) as they become ready.

## 👀 Monitoring the Run

The three agents (Gemini, Codex, and Claude) work in sequence. You can monitor the progress by watching the output file:

```powershell
# In a separate terminal, you can tail the file
Get-Content artifacts/text/test.txt -Wait
```

The full run is complete when **9 lines** have been written to `artifacts/text/test.txt`.

## 🛑 Auto Stop Action
As soon as you confirm all 9 lines are present, stop the Gemini worker yourself. The loop keeps waiting otherwise, so send `Ctrl+C` (or close the terminal) right away instead of leaving the process running for someone else.