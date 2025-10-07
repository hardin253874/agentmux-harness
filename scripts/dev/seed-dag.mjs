// Seed the tasks DB from a YAML DAG (minimal implementation for local smoke tests)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const stateDir = path.join(projectRoot, 'state');
const artifactsDir = path.join(projectRoot, 'artifacts');
const dagPath = path.join(projectRoot, 'examples', 'textchain', 'agentmux', 'dag.yaml');
const schemaPath = path.join(__dirname, 'schema.sql');

fs.mkdirSync(stateDir, { recursive: true });
fs.mkdirSync(artifactsDir, { recursive: true });

const dbPath = path.join(stateDir, 'tasks.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

const dagYaml = fs.readFileSync(dagPath, 'utf8');
const dag = YAML.parse(dagYaml);

const now = Math.floor(Date.now()/1000);
const upsert = db.prepare(`INSERT INTO tasks (id,name,agent,deps,status,payload,created_at,updated_at)
VALUES (@id,@name,@agent,@deps,@status,@payload,@now,@now)
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name, agent=excluded.agent, deps=excluded.deps, payload=excluded.payload, updated_at=excluded.updated_at;
`);

const existingIds = new Set(db.prepare('SELECT id FROM tasks').all().map(r=>r.id));

for (const t of dag.tasks) {
  const deps = JSON.stringify(t.deps || []);
  const payload = JSON.stringify(t.payload || {});
  upsert.run({ id: t.id, name: t.name, agent: t.agent, deps, status: 'PENDING', payload, now });
}

function allDepsDone(deps) {
  if (!deps || deps.length === 0) return true;
  const q = db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE id IN (${deps.map(()=>'?').join(',')}) AND status='DONE'`);
  const row = q.get(...deps);
  return row.n === deps.length;
}

const selectAll = db.prepare('SELECT * FROM tasks');
const rows = selectAll.all();
for (const r of rows) {
  const deps = JSON.parse(r.deps || '[]');
  const st = allDepsDone(deps) ? 'READY' : 'PENDING';
  if (st !== r.status) {
    db.prepare('UPDATE tasks SET status=?, updated_at=? WHERE id=?').run(st, now, r.id);
  }
}

db.prepare('INSERT INTO events (ts,type,data) VALUES (?,?,?)').run(now, 'seeded', JSON.stringify({ dag: dagPath }));

console.log(`Seeded ${dag.tasks.length} tasks into ${dbPath}`);