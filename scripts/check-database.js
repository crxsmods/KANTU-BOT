import { db, dbReady, closeDatabase, databaseMode } from '../lib/postgres.js'


let client

try {
  const status = await dbReady
  client = await db.connect()

  await client.query('BEGIN')
  await client.query(`CREATE TEMP TABLE kantu_healthcheck (
    id INTEGER PRIMARY KEY,
    value TEXT NOT NULL
  ) ON COMMIT DROP`)
  await client.query('INSERT INTO kantu_healthcheck (id, value) VALUES ($1, $2)', [1, 'ok'])
  const writeCheck = await client.query('SELECT value FROM kantu_healthcheck WHERE id = $1', [1])
  await client.query('ROLLBACK')

  const tables = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  const migrations = await db.query('SELECT version FROM schema_migrations ORDER BY version')

  console.log('DB_ACTIVE=true')
  console.log(`READ_WRITE=${writeCheck.rows[0]?.value === 'ok'}`)
  console.log(`DATABASE_MODE=${databaseMode}`)
  console.log(`DATABASE=${status.database_name}`)
  console.log(`TABLES=${tables.rowCount}`)
  console.log(`TABLE_NAMES=${tables.rows.map(row => row.table_name).join(',')}`)
  console.log(`MIGRATIONS=${migrations.rows.map(row => row.version).join(',')}`)
} catch (error) {
  if (client) await client.query('ROLLBACK').catch(() => {})
  console.error('DB_ACTIVE=false')
  console.error(error?.message || error)
  process.exitCode = 1
} finally {
  client?.release()
  await closeDatabase().catch(() => {})
}
