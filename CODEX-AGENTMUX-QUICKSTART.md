# Codex Agent -> Agentmux Quickstart

## Goal
Your goal is to participate in a multi-agent sequence to collaboratively write a text file. You are ONLY responsible for the "Codex" agent steps.

The sequence is defined in `examples/textchain/agentmux/dag.yaml` and involves three agents: Gemini, Codex, and Claude. In total, nine lines will be written to the output file.

## Scope
- Act only as the Codex agent.
- Run Codex commands from Windows PowerShell so `node.exe` is on the PATH.
- Let the Codex worker write the line; do not edit the file manually.

## Do & Don't
**Do**
- Start the Codex worker once Gemini finishes and wait for the Codex task to run.
- Monitor `artifacts\text\test.txt` to confirm the Codex line appears in sequence.
- Stop the Codex worker yourself (`Ctrl+C` or close the terminal) as soon as total 9 lines are written.

**Don't**
- Don't start Gemini or Claude workers.
- Don't leave the Codex worker running after your step completes.
- Don't modify the output file by hand.

## How Agentmux-Comms orchestrates Codex
- Tasks live in `examples/textchain/agentmux/dag.yaml` with IDs like `write:2-codex`.
- Each Codex task depends on the previous agent finishing first.
- The worker loop reads `state/tasks.db`, claims READY Codex tasks, runs `ai/codex-cli/bin/codex.ps1`, and marks them DONE.

## What you run
Always start the worker from PowerShell:

```powershell
node scripts/dev/worker.mjs codex
```

If the command fails with `node: command not found`, stay in PowerShell and run:

```powershell
Get-Command node
```

Fix the PATH before retrying the worker.

## Success criteria
- Exactly one Codex line is appended immediately after Gemini in `artifacts\text\test.txt`.
- The worker is stopped right after the Codex line is confirmed.
- The file remains ready for Claude to add the following line.

## 🛑 Auto Stop Action
As soon as you confirm all 9 lines are present, stop the Gemini worker yourself. The loop keeps waiting otherwise, so send `Ctrl+C` (or close the terminal) right away instead of leaving the process running for someone else.