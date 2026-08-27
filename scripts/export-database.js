// ═══════════════════════════════════════════════════════════════════════
// scripts/export-database.js — Respaldo completo de PostgreSQL a JSON.gz
// Uso: npm run db:backup
// Genera backups/backup-<timestamp>.json.gz con: tablas y filas, columnas,
// restricciones, índices, triggers, secuencias, vistas, funciones, enums
// y extensiones. NUNCA imprime DATABASE_URL.
// ═══════════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { db, dbReady, closeDatabase } from '../lib/postgres.js';

const BACKUP_DIR = './backups';

async function getTablesAndRows() {
  const { rows: tables } = await db.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
  );
  const data = {};
  for (const { table_name } of tables) {
    const { rows } = await db.query(`SELECT * FROM "${table_name}"`);
    data[table_name] = rows;
  }
  return data;
}

async function getColumns() {
  const { rows } = await db.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  return rows;
}

async function getConstraints() {
  const { rows } = await db.query(`
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  return rows;
}

async function getIndexes() {
  const { rows } = await db.query(`
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  return rows;
}

async function getTriggers() {
  const { rows } = await db.query(`
    SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation, action_statement
    FROM information_schema.triggers WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `);
  return rows;
}

async function getSequences() {
  const { rows } = await db.query(`
    SELECT sequence_name, data_type, start_value, minimum_value, maximum_value, increment
    FROM information_schema.sequences WHERE sequence_schema = 'public'
    ORDER BY sequence_name
  `);
  return rows;
}

async function getViews() {
  const { rows } = await db.query(`
    SELECT table_name AS view_name, view_definition
    FROM information_schema.views WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  return rows;
}

async function getFunctions() {
  const { rows } = await db.query(`
    SELECT routine_name, routine_type, data_type AS return_type
    FROM information_schema.routines WHERE routine_schema = 'public'
    ORDER BY routine_name
  `);
  return rows;
}

async function getEnums() {
  const { rows } = await db.query(`
    SELECT t.typname AS enum_name, e.enumlabel AS value
    FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);
  return rows;
}

async function getExtensions() {
  const { rows } = await db.query(`SELECT extname, extversion FROM pg_extension ORDER BY extname`);
  return rows;
}

async function main() {
  console.log('\n=== Generando respaldo de PostgreSQL ===\n');
  await dbReady;

  const backup = {
    generated_at: new Date().toISOString(),
    tables_and_rows: await getTablesAndRows(),
    columns: await getColumns(),
    constraints: await getConstraints(),
    indexes: await getIndexes(),
    triggers: await getTriggers(),
    sequences: await getSequences(),
    views: await getViews(),
    functions: await getFunctions(),
    enums: await getEnums(),
    extensions: await getExtensions(),
  };

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(BACKUP_DIR, `backup-${ts}.json.gz`);
  const json = JSON.stringify(backup, null, 2);
  const gz = zlib.gzipSync(Buffer.from(json, 'utf-8'));
  fs.writeFileSync(outPath, gz);

  console.log(`  \u2714 Respaldo generado: ${outPath} (${(gz.length / 1024).toFixed(1)} KB comprimido)`);
  console.log(`  \u2714 Tablas respaldadas: ${Object.keys(backup.tables_and_rows).length}`);

  await closeDatabase();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Error generando el respaldo:', err);
  try { await closeDatabase(); } catch {}
  process.exit(1);
});
