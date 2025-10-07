// Minimal worker that runs tasks for a specific agent (shell + noop only)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const stateDir = path.join(projectRoot, 'state');
fs.mkdirSync(stateDir, { recursive: true });
const dbPath = path.join(stateDir, 'tasks.db');

const args = process.argv.slice(2);
const agentFlag = args[0];
if (!agentFlag) {
  console.error('Usage: node scripts/dev/worker.mjs <agentName>');
  process.exit(1);
}
const agent = agentFlag;

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function logEvent(type, task_id, data) {
  db.prepare('INSERT INTO events (ts,type,task_id,data) VALUES (?,?,?,?)')
    .run(Math.floor(Date.now()/1000), type, task_id || null, JSON.stringify(data || {}));
}

function depsDone(ids) {
  if (!ids || ids.length === 0) return true;
  const q = db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE id IN (${ids.map(()=>'?').join(',')}) AND status='DONE'`);
  const r = q.get(...ids);
  return r.n === ids.length;
}

function tryClaim() {
  const now = Math.floor(Date.now()/1000);
  const candidates = db
    .prepare(`SELECT * FROM tasks WHERE agent=? AND status IN ('READY','PENDING') ORDER BY created_at ASC`)
    .all(agent);

  for (const r of candidates) {
    const deps = JSON.parse(r.deps || '[]');
    if (!depsDone(deps)) continue;

    const res = db
      .prepare(`UPDATE tasks SET status=?, claimed_by=?, lease_until=?, updated_at=? WHERE id=? AND status IN ('READY','PENDING')`)
      .run('RUNNING', agent, now + 120, now, r.id);

    if (res.changes === 1) return r.id;
  }
  return null;
}

async function runTask(id) {
  const row = db.prepare('SELECT * FROM tasks WHERE id=?').get(id);
  const payload = JSON.parse(row.payload || '{}');
  logEvent('start', id, { agent, payload });

  try {
    if ((payload.kind || '').toLowerCase() === 'noop') {
      // nothing
    } else if ((payload.kind || '').toLowerCase() === 'shell') {
      const repoPath = payload.repoPath || '.';
      const cmd = payload.cmd;
      if (!cmd) throw new Error('shell payload missing cmd');
      await runShell(repoPath, cmd);
    } else {
      throw new Error(`Unsupported payload kind: ${payload.kind}`);
    }

    db.prepare('UPDATE tasks SET status=?, updated_at=? WHERE id=?').run('DONE', Math.floor(Date.now()/1000), id);
    logEvent('done', id, {});
  } catch (err) {
    db.prepare('UPDATE tasks SET status=?, updated_at=? WHERE id=?').run('FAILED', Math.floor(Date.now()/1000), id);
    logEvent('failed', id, { error: String(err) });
    console.error(`[${agent}] Task ${id} failed:`, err);
  }
}

function runShell(cwd, commandLine) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandLine, { cwd: path.resolve(projectRoot, cwd), shell: true, stdio: 'inherit' });
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`child exited with code ${code}`))));
  });
}

async function recomputeReady() {
  const all = db.prepare('SELECT id, deps, status FROM tasks').all();
  const now = Math.floor(Date.now()/1000);
  for (const r of all) {
    if (r.status !== 'PENDING') continue;
    const deps = JSON.parse(r.deps || '[]');
    if (depsDone(deps)) {
      db.prepare('UPDATE tasks SET status=?, updated_at=? WHERE id=?').run('READY', now, r.id);
    }
  }
}

(async function main() {
  console.log(`[worker] agent=${agent} db=${dbPath}`);
  for (;;) {
    const id = tryClaim();
    if (id) {
      await runTask(id);
      await recomputeReady();
    } else {
      await recomputeReady();
      await new Promise(r => setTimeout(r, 1000));
    }
  }
})();
