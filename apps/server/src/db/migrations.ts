import fs from 'fs';
import path from 'path';
import { db } from './database';

export function runMigrations() {
  // Ensure schema_versions table exists first
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      version    INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const versionMatch = file.match(/^(\d+)_/);
    if (!versionMatch) continue;
    const version = parseInt(versionMatch[1], 10);

    const alreadyApplied = db
      .prepare('SELECT version FROM schema_versions WHERE version = ?')
      .get(version);

    if (alreadyApplied) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT OR IGNORE INTO schema_versions (version) VALUES (?)').run(version);
    });

    applyMigration();
    console.log(`Applied migration: ${file}`);
  }
}
