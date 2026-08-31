import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as acorn from 'acorn'
import * as walk from 'acorn-walk'
import { canonicalizeQuery, queryOperationId } from '../lib/query-operation.js'

const root = process.cwd()
const outputFile = path.join(root, 'lib', 'query-catalog.json')
const sourceDirectories = ['lib', 'plugins', 'src']
const sourceFiles = ['handler.js', 'index.js', 'main.js', 'config.js']
const ignoredFiles = new Set([
  path.normalize('lib/query-operation.js')
])
const tableDomains = new Map([
  ['usuarios', 'users'],
  ['group_settings', 'groups'],
  ['chats', 'groups'],
  ['messages', 'groups'],
  ['characters', 'characters'],
  ['subbots', 'bots'],
  ['reportes', 'reports'],
  ['chat_memory', 'memory'],
  ['stats', 'stats']
])
const forbiddenSql = [
  ['multiples sentencias', /;/],
  ['comentarios SQL', /--|\/\*/],
  ['DDL o administracion', /\b(?:ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|VACUUM|ANALYZE|COPY|CALL|RESET|LISTEN|NOTIFY)\b/i],
  ['almacen heredado de secretos', /\b(?:api_tokens|tokens)\b/i],
  ['catalogo interno', /\b(?:schema_migrations|information_schema|pg_catalog|pg_[a-z0-9_]+)\b/i]
]

const files = []
const visit = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(filename)
    else if (/\.(?:js|mjs)$/i.test(entry.name)) files.push(filename)
  }
}
for (const directory of sourceDirectories) {
  const absolute = path.join(root, directory)
  if (fs.existsSync(absolute)) visit(absolute)
}
for (const filename of sourceFiles) {
  const absolute = path.join(root, filename)
  if (fs.existsSync(absolute)) files.push(absolute)
}

const isDatabaseQuery = node => {
  const callee = node.callee
  if (callee?.type !== 'MemberExpression' || callee.computed || callee.property?.name !== 'query') return false
  const receiver = callee.object
  if (receiver?.type === 'Identifier') return receiver.name === 'db'
  return receiver?.type === 'MemberExpression' && !receiver.computed && receiver.property?.name === 'db'
}

const staticText = node => {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked
  }
  return null
}

const operations = new Map()
const failures = []
for (const absolute of files.sort()) {
  const relative = path.relative(root, absolute)
  if (ignoredFiles.has(path.normalize(relative))) continue
  const source = fs.readFileSync(absolute, 'utf8')
  let ast
  try {
    ast = acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      allowAwaitOutsideFunction: true
    })
  } catch (error) {
    failures.push(`${relative}: no se pudo analizar: ${error.message}`)
    continue
  }
  const privileged = /handler\.(?:owner|rowner)\s*=\s*true\b/.test(source)

  walk.simple(ast, {
    CallExpression(node) {
      if (!isDatabaseQuery(node)) return
      const text = staticText(node.arguments[0])
      if (text === null) {
        // lib/simple.js solo reenvia los argumentos al adaptador real.
        if (relative === path.join('lib', 'simple.js') && node.arguments[0]?.type === 'SpreadElement') return
        failures.push(`${relative}:${node.loc.start.line}: consulta dinamica no permitida`)
        return
      }

      let canonical
      try {
        canonical = canonicalizeQuery(text)
      } catch (error) {
        failures.push(`${relative}:${node.loc.start.line}: ${error.message}`)
        return
      }
      if (!/^(?:SELECT|INSERT|UPDATE|DELETE|WITH)\b/i.test(canonical)) {
        failures.push(`${relative}:${node.loc.start.line}: operacion SQL no admitida`)
        return
      }
      for (const [label, pattern] of forbiddenSql) {
        if (pattern.test(canonical)) {
          failures.push(`${relative}:${node.loc.start.line}: ${label}`)
          return
        }
      }

      const tables = [...tableDomains.keys()].filter(table =>
        new RegExp(`\\b${table}\\b`, 'i').test(canonical)
      )
      if (!tables.length) {
        failures.push(`${relative}:${node.loc.start.line}: no referencia una tabla de aplicacion`)
        return
      }

      const id = queryOperationId(canonical)
      const existing = operations.get(id) || {
        id,
        text: canonical,
        access: /^(?:SELECT)\b/i.test(canonical) ||
          (/^WITH\b/i.test(canonical) && !/\b(?:INSERT|UPDATE|DELETE)\b/i.test(canonical))
          ? 'read'
          : 'write',
        tables,
        parameterCount: Math.max(0, ...[...canonical.matchAll(/\$(\d+)/g)].map(match => Number(match[1]))),
        sources: []
      }
      existing.sources.push({
        file: relative.replaceAll('\\', '/'),
        line: node.loc.start.line,
        privileged
      })
      operations.set(id, existing)
    }
  })
}

if (failures.length) {
  console.error(`Catalogo rechazado con ${failures.length} problema(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

const catalogOperations = [...operations.values()]
  .map(operation => {
    const domains = [...new Set(operation.tables.map(table => tableDomains.get(table)))].sort()
    const officialOnly = operation.sources.every(source => source.privileged)
    const economy = operation.access === 'write' &&
      (operation.tables.includes('usuarios') || operation.tables.includes('characters')) &&
      /\b(?:exp|money|limite|banco|price|claimed_by|for_sale|seller|votes)\b/i.test(operation.text)
    return {
      ...operation,
      scopes: [
        ...domains.map(domain => `${domain}:${operation.access}`),
        ...(officialOnly ? ['official:admin'] : [])
      ],
      risk: economy ? 'economy' : operation.access,
      sources: operation.sources
        .map(({ file, line }) => ({ file, line }))
        .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

const catalog = {
  format: 'kantu-query-catalog',
  version: 1,
  operations: catalogOperations
}
const serialized = JSON.stringify(catalog, null, 2) + '\n'

if (process.argv.includes('--check')) {
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf8') : ''
  if (current !== serialized) {
    console.error('lib/query-catalog.json no esta actualizado. Ejecuta npm run queries:generate.')
    process.exit(1)
  }
  console.log(`Catalogo SQL OK: ${catalogOperations.length} operaciones cerradas.`)
} else {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, serialized, { mode: 0o644 })
  console.log(`Catalogo generado: ${catalogOperations.length} operaciones en ${path.relative(root, outputFile)}.`)
}
