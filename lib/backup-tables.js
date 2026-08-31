const protectedTables = new Set(['api_tokens', 'tokens'])
const identifier = /^[a-z_][a-z0-9_]*$/i

export function resolveBackupExcludedTables(environment = process.env) {
  const configured = String(environment.BACKUP_EXCLUDE_TABLES || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  for (const table of configured) {
    if (!identifier.test(table)) throw new Error(`Tabla excluida de respaldo invalida: ${table}`)
  }

  return [...new Set([...protectedTables, ...configured])].sort()
}

export function isProtectedBackupTable(table) {
  return protectedTables.has(String(table))
}
