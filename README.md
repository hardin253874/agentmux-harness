#run
rmdir -Recurse -Force .\state
node scripts/dev/seed-dag.mjs


then open 3 terminals
node scripts/dev/worker.mjs gemini
node scripts/dev/worker.mjs codex
node scripts/dev/worker.mjs claude
