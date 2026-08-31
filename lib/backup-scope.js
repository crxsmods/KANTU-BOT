const managedSchemas = new Set([
  'auth',
  'extensions',
  'graphql',
  'graphql_public',
  'pgbouncer',
  'realtime',
  'storage',
  'supabase_functions',
  'vault'
])

export function resolveBackupSchemas(value = process.env.BACKUP_SCHEMAS || 'public') {
  const schemas = [...new Set(String(value)
    .split(',')
    .map(schema => schema.trim())
    .filter(Boolean))]

  if (!schemas.length || schemas.some(schema => !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(schema))) {
    throw new Error('BACKUP_SCHEMAS contiene un nombre de esquema invalido.')
  }

  const blocked = schemas.filter(schema => managedSchemas.has(schema.toLowerCase()))
  if (blocked.length) {
    throw new Error('BACKUP_SCHEMAS no puede incluir esquemas administrados: ' + blocked.join(', ') + '.')
  }
  return schemas
}
