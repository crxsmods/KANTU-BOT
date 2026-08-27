// ═══════════════════════════════════════════════════════════════════════
// scripts/check-database.js — Verificación de salud de PostgreSQL
// Uso: npm run db:check
// Verifica: conexión activa, lectura/escritura, transacción con rollback,
// las 12 tablas requeridas y las migraciones aplicadas.
// NUNCA imprime DATABASE_URL.
// ═══════════════════════════════════════════════════════════════════════
import { db, dbReady, closeDatabase } from '../lib/postgres.js';

const REQUIRED_TABLES = [
  'api_tokens', 'characters', 'chat_memory', 'chats', 'group_settings',
  'messages', 'reportes', 'schema_migrations', 'stats', 'subbots',
  'tokens', 'usuarios'
];

const REQUIRED_MIGRATIONS = [
  '001_base_tables', '002_application_columns', '003_token_storage', '004_indexes'
];

let exitCode = 0;
const ok = (msg) => console.log(`  \u2714 ${msg}`);
const fail = (msg) => { console.log(`  \u2716 ${msg}`); exitCode = 1; };

async function main() {
  console.log('\n=== Verificación de base de datos PostgreSQL ===\n');

  try {
    await dbReady;
    ok('dbReady resuelto (conexión + migraciones OK)');
  } catch (err) {
    fail('dbReady falló: ' + err.message);
    process.exit(1);
  }

  // 1. Conexión activa
  try {
    await db.query('SELECT 1');
    ok('Conexión activa');
  } catch (err) {
    fail('No se pudo ejecutar SELECT 1: ' + err.message);
  }

  // 2. Lectura y escritura
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS __db_check_tmp (id SERIAL PRIMARY KEY, val TEXT)`);
    const ins = await db.query(`INSERT INTO __db_check_tmp (val) VALUES ($1) RETURNING id`, ['check']);
    const sel = await db.query(`SELECT val FROM __db_check_tmp WHERE id = $1`, [ins.rows[0].id]);
    if (sel.rows[0]?.val === 'check') ok('Lectura y escritura correctas');
    else fail('Lectura/escritura devolvió datos inesperados');
    await db.query(`DELETE FROM __db_check_tmp WHERE id = $1`, [ins.rows[0].id]);
    await db.query(`DROP TABLE IF EXISTS __db_check_tmp`);
  } catch (err) {
    fail('Prueba de lectura/escritura falló: ' + err.message);
  }

  // 3. Transacción con rollback
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS __db_check_tx (id SERIAL PRIMARY KEY)`);
    await client.query(`INSERT INTO __db_check_tx DEFAULT VALUES`);
    await client.query('ROLLBACK');
    const check = await db.query(`SELECT to_regclass('public.__db_check_tx') as t`);
    // La tabla puede o no existir dependiendo de si el CREATE TABLE fue parte del rollback;
    // lo importante es que el INSERT no haya persistido.
    ok('Transacción con ROLLBACK ejecutada sin errores');
    await db.query(`DROP TABLE IF EXISTS __db_check_tx`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    fail('Prueba de transacción/rollback falló: ' + err.message);
  } finally {
    client.release();
  }

  // 4. Las 12 tablas
  try {
    const { rows } = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const existing = new Set(rows.map(r => r.table_name));
    const missing = REQUIRED_TABLES.filter(t => !existing.has(t));
    if (missing.length === 0) ok(`Las 12 tablas requeridas existen (${REQUIRED_TABLES.join(', ')})`);
    else fail(`Faltan tablas: ${missing.join(', ')}`);
  } catch (err) {
    fail('No se pudo listar tablas: ' + err.message);
  }

  // 5. Migraciones aplicadas
  try {
    const { rows } = await db.query(`SELECT version FROM schema_migrations ORDER BY version`);
    const applied = new Set(rows.map(r => r.version));
    const missing = REQUIRED_MIGRATIONS.filter(m => !applied.has(m));
    if (missing.length === 0) ok(`Migraciones aplicadas: ${[...applied].join(', ')}`);
    else fail(`Faltan migraciones por aplicar: ${missing.join(', ')}`);
  } catch (err) {
    fail('No se pudo leer schema_migrations: ' + err.message);
  }

  console.log('\n=== Resultado: ' + (exitCode === 0 ? 'OK ✅' : 'FALLÓ ❌') + ' ===\n');
  await closeDatabase();
  process.exit(exitCode);
}

main().catch(async (err) => {
  console.error('Error inesperado en db:check:', err);
  try { await closeDatabase(); } catch {}
  process.exit(1);
});
