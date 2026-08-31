import { createHash } from 'crypto'
import path from 'node:path'
import { mkdir, writeFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import { db, dbReady, databaseMode } from '../lib/postgres.js'
import { runtimePaths } from '../lib/paths.js'
import { resolveBackupSchemas } from '../lib/backup-scope.js'
import { resolveBackupExcludedTables } from '../lib/backup-tables.js'

const quoteIdentifier = value => `"${String(value).replaceAll('"', '""')}"`
const qualifiedName = (schema, name) => `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`
const backupSchemas = resolveBackupSchemas()
const excludedTables = resolveBackupExcludedTables()

const replacer = (_key, value) => {
  if (typeof value === 'bigint') return { $type: 'bigint', value: value.toString() }
  if (Buffer.isBuffer(value)) return { $type: 'buffer', encoding: 'base64', value: value.toString('base64') }
  return value
}

async function queryRows(text, params = []) {
  const result = await db.query(text, params)
  return result.rows
}

async function exportDatabase() {
  await dbReady
  const startedAt = new Date()
  const [status] = await queryRows(`
    SELECT
      version() AS server_version,
      current_database() AS database_name,
      pg_database_size(current_database())::text AS database_size_bytes
  `)

  const tables = await queryRows(`
    SELECT c.oid::text AS oid, n.nspname AS schema, c.relname AS name,
           CASE c.relkind WHEN 'p' THEN 'partitioned_table' ELSE 'table' END AS kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname = ANY($1::text[])
      AND NOT (c.relname = ANY($2::text[]))
    ORDER BY n.nspname, c.relname
  `, [backupSchemas, excludedTables])

  const tableBackups = []
  for (const table of tables) {
    const columns = await queryRows(`
      SELECT column_name, ordinal_position, data_type, udt_schema, udt_name,
             is_nullable, column_default, is_identity, identity_generation,
             is_generated, generation_expression
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [table.schema, table.name])

    const constraints = await queryRows(`
      SELECT conname AS name, contype AS type,
             pg_get_constraintdef(oid, true) AS definition
      FROM pg_constraint
      WHERE conrelid = $1::oid
      ORDER BY conname
    `, [table.oid])

    const indexes = await queryRows(`
      SELECT indexname AS name, indexdef AS definition
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2
      ORDER BY indexname
    `, [table.schema, table.name])

    const triggers = await queryRows(`
      SELECT tgname AS name, pg_get_triggerdef(oid, true) AS definition
      FROM pg_trigger
      WHERE tgrelid = $1::oid AND NOT tgisinternal
      ORDER BY tgname
    `, [table.oid])

    const rows = await queryRows(`SELECT * FROM ${qualifiedName(table.schema, table.name)}`)
    tableBackups.push({ ...table, columns, constraints, indexes, triggers, row_count: rows.length, rows })
    console.log(`Exportada ${table.schema}.${table.name}: ${rows.length} filas`)
  }

  const sequenceList = await queryRows(`
    SELECT n.nspname AS schema, c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname = ANY($1::text[])
    ORDER BY n.nspname, c.relname
  `, [backupSchemas])

  const sequences = []
  for (const sequence of sequenceList) {
    const [state] = await queryRows(`SELECT last_value::text, is_called FROM ${qualifiedName(sequence.schema, sequence.name)}`)
    sequences.push({ ...sequence, ...state })
  }

  const views = await queryRows(`
    SELECT schemaname AS schema, viewname AS name, definition
    FROM pg_views
    WHERE schemaname = ANY($1::text[])
    ORDER BY schemaname, viewname
  `, [backupSchemas])

  const materializedViews = await queryRows(`
    SELECT schemaname AS schema, matviewname AS name, definition,
           ispopulated AS is_populated
    FROM pg_matviews
    WHERE schemaname = ANY($1::text[])
    ORDER BY schemaname, matviewname
  `, [backupSchemas])

  const functions = await queryRows(`
    SELECT n.nspname AS schema, p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS arguments,
           pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = ANY($1::text[])
    ORDER BY n.nspname, p.proname, arguments
  `, [backupSchemas])

  const enums = await queryRows(`
    SELECT n.nspname AS schema, t.typname AS name,
           json_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = ANY($1::text[])
    GROUP BY n.nspname, t.typname
    ORDER BY n.nspname, t.typname
  `, [backupSchemas])

  const extensions = await queryRows(`
    SELECT extname AS name, extversion AS version
    FROM pg_extension
    ORDER BY extname
  `)

  const backup = {
    format: 'kantu-postgresql-logical-backup',
    format_version: 1,
    exported_at: startedAt.toISOString(),
    database: status,
    schemas: backupSchemas,
    tables: tableBackups,
    sequences,
    views,
    materialized_views: materializedViews,
    functions,
    enums,
    extensions
  }

  const timestamp = startedAt.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  const outputDirectory = runtimePaths.backups
  await mkdir(outputDirectory, { recursive: true })
  const outputFile = path.join(outputDirectory, `kantu-db-${timestamp}.json.gz`)
  const compressed = gzipSync(Buffer.from(JSON.stringify(backup, replacer)), { level: 9 })
  await writeFile(outputFile, compressed, { mode: 0o600 })

  const checksum = createHash('sha256').update(compressed).digest('hex')
  const totalRows = tableBackups.reduce((total, table) => total + table.row_count, 0)
  console.log(`DB_ACTIVE=true`)
  console.log(`DATABASE_SIZE_BYTES=${status.database_size_bytes}`)
  console.log(`TABLES=${tableBackups.length}`)
  console.log(`ROWS=${totalRows}`)
  console.log(`BACKUP_FILE=${outputFile}`)
  console.log(`BACKUP_BYTES=${compressed.length}`)
  console.log(`SHA256=${checksum}`)
}

try {
  await exportDatabase()
} catch (error) {
  console.error(`DB_ACTIVE=false`)
  console.error(error?.message || error)
  process.exitCode = 1
} finally {
  await new Promise(resolve => setTimeout(resolve, 500))
  await db.end().catch(() => {})
}
