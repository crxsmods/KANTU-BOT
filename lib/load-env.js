import fs from 'node:fs'
import dotenv from 'dotenv'
import { hasCompleteDatabaseAuthority, readRawEnvValue } from './database-url.js'

if (fs.existsSync('.env')) {
  const parsed = dotenv.parse(fs.readFileSync('.env', 'utf8'))
  for (const [name, value] of Object.entries(parsed)) {
    if (process.env[name] === undefined) process.env[name] = value
  }

  // Compatibilidad con contraseñas antiguas que contienen # sin codificar.
  // PostgreSQL normaliza la URL despues; no se registra nunca su contenido.
  if (!hasCompleteDatabaseAuthority(process.env.DATABASE_URL || '')) {
    const rawDatabaseUrl = readRawEnvValue('DATABASE_URL')
    if (rawDatabaseUrl) process.env.DATABASE_URL = rawDatabaseUrl
  }
}
