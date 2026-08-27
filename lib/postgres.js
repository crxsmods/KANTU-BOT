// ═══════════════════════════════════════════════════════════════════════
// lib/postgres.js — Capa de acceso a PostgreSQL (Kantu Bot)
// ───────────────────────────────────────────────────────────────────────
// - Usa exclusivamente DATABASE_URL desde .env (dotenv). Nunca se imprime,
//   reemplaza ni sube a ningún lado.
// - Pool reutilizable de "pg", soporta contraseñas con caracteres
//   especiales (#, @, :, /, %) porque la connectionString se pasa TAL
//   CUAL a pg (que usa su propio parser de URL), sin recortar/reconstruir
//   manualmente la cadena.
// - Migraciones versionadas, transaccionales y protegidas con
//   pg_advisory_lock para evitar carreras entre procesos (bot principal +
//   subbots).
// - Cache en memoria (TTL ~10s) para getSubbotConfig().
// ═══════════════════════════════════════════════════════════════════════

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    '[DB] ❌ La variable de entorno DATABASE_URL no está definida.\n' +
    '     Crea un archivo .env (basado en .env.example) con tu cadena de conexión de PostgreSQL/Supabase.'
  );
}

// ───────────────────────────────────────────────────────────────────────
// Configuración del Pool (vía variables de entorno, con defaults sanos)
// ───────────────────────────────────────────────────────────────────────
const DB_POOL_MAX = parseInt(process.env.DB_POOL_MAX || '10', 10);
const DB_CONNECTION_TIMEOUT_MS = parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '10000', 10);
const DB_IDLE_TIMEOUT_MS = parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10);

function resolveSSL(connectionString) {
  // Permite forzar el comportamiento con DB_SSL=true/false
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true') return { rejectUnauthorized: false };
  try {
    const { hostname } = new URL(connectionString);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  } catch {
    // Si no se puede parsear (raro), asumimos que necesita SSL (Supabase/hosts remotos)
  }
  return { rejectUnauthorized: false };
}

export const db = new Pool({
  connectionString: DATABASE_URL,
  max: DB_POOL_MAX,
  connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: DB_IDLE_TIMEOUT_MS,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: resolveSSL(DATABASE_URL),
});

// Evita que un error en un cliente inactivo del pool tumbe el proceso
db.on('error', (err) => {
  console.error('[DB] ⚠️ Error inesperado en cliente inactivo del pool:', err.message);
});

// ═══════════════════════════════════════════════════════════════════════
// SISTEMA DE MIGRACIONES (versionadas, transaccionales, con advisory lock)
// ═══════════════════════════════════════════════════════════════════════

// Clave arbitraria (bigint) para el advisory lock de migraciones.
// Evita que dos procesos (bot principal + subbots) corran migraciones a la vez.
const MIGRATIONS_LOCK_KEY = 7_273_730_01;

const MIGRATIONS = [
  {
    name: '001_base_tables',
    async up(client) {
      // Tablas "núcleo" — se crean con su PK; las columnas de aplicación
      // se agregan de forma idempotente en 002_application_columns.
      await client.query(`
        CREATE TABLE IF NOT EXISTS group_settings (
          group_id TEXT PRIMARY KEY
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id TEXT PRIMARY KEY
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          is_group BOOLEAN DEFAULT true,
          timestamp BIGINT,
          is_active BOOLEAN DEFAULT true,
          bot_id TEXT,
          joined BOOLEAN DEFAULT true
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          user_id TEXT,
          group_id TEXT,
          message_count INTEGER DEFAULT 0,
          PRIMARY KEY (user_id, group_id)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS characters (
          id SERIAL PRIMARY KEY
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS subbots (
          id TEXT PRIMARY KEY
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS reportes (
          id SERIAL PRIMARY KEY,
          sender_id TEXT NOT NULL,
          sender_name TEXT,
          mensaje TEXT NOT NULL,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          enviado BOOLEAN DEFAULT false,
          tipo TEXT DEFAULT 'reporte'
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_memory (
          chat_id TEXT PRIMARY KEY,
          history JSONB,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS stats (
          command TEXT PRIMARY KEY,
          count INTEGER DEFAULT 1
        );
      `);
    },
  },

  {
    name: '002_application_columns',
    async up(client) {
      const columnasGrupos = [
        ['welcome', 'BOOLEAN DEFAULT true'],
        ['detect', 'BOOLEAN DEFAULT true'],
        ['antifake', 'BOOLEAN DEFAULT false'],
        ['antilink', 'BOOLEAN DEFAULT false'],
        ['antilink2', 'BOOLEAN DEFAULT false'],
        ['antiporn', 'BOOLEAN DEFAULT false'],
        ['modohorny', 'BOOLEAN DEFAULT false'],
        ['audios', 'BOOLEAN DEFAULT false'],
        ['nsfw_horario', 'TEXT'],
        ['antistatus', 'BOOLEAN DEFAULT false'],
        ['modoadmin', 'BOOLEAN DEFAULT false'],
        ['photowelcome', 'BOOLEAN DEFAULT false'],
        ['photobye', 'BOOLEAN DEFAULT false'],
        ['autolevelup', 'BOOLEAN DEFAULT true'],
        ['swelcome', 'TEXT'],
        ['sbye', 'TEXT'],
        ['spromote', 'TEXT'],
        ['sdemote', 'TEXT'],
        ['banned', 'BOOLEAN DEFAULT false'],
        ['expired', 'BIGINT DEFAULT 0'],
        ['memory_ttl', 'INTEGER DEFAULT 86400'],
        ['sautorespond', 'TEXT'],
        ['primary_bot', 'TEXT'],
      ];
      for (const [columna, tipo] of columnasGrupos) {
        await client.query(`ALTER TABLE group_settings ADD COLUMN IF NOT EXISTS ${columna} ${tipo}`);
      }

      const columnasUsuarios = [
        ['nombre', 'TEXT'],
        ['registered', 'BOOLEAN DEFAULT false'],
        ['num', 'TEXT'],
        ['lid', 'TEXT UNIQUE'],
        ['banned', 'BOOLEAN DEFAULT false'],
        ['warn_pv', 'BOOLEAN DEFAULT false'],
        ['warn', 'INTEGER DEFAULT 0'],
        ['warn_antiporn', 'INTEGER DEFAULT 0'],
        ['warn_estado', 'INTEGER DEFAULT 0'],
        ['edad', 'INTEGER'],
        ['money', 'INTEGER DEFAULT 100'],
        ['limite', 'INTEGER DEFAULT 10'],
        ['exp', 'INTEGER DEFAULT 0'],
        ['banco', 'INTEGER DEFAULT 0'],
        ['level', 'INTEGER DEFAULT 0'],
        ['role', "TEXT DEFAULT 'novato'"],
        ['reg_time', 'TIMESTAMP'],
        ['serial_number', 'TEXT'],
        ['sticker_packname', 'TEXT'],
        ['sticker_author', 'TEXT'],
        ['ry_time', 'BIGINT DEFAULT 0'],
        ['lastwork', 'BIGINT DEFAULT 0'],
        ['lastmiming', 'BIGINT DEFAULT 0'],
        ['lastclaim', 'BIGINT DEFAULT 0'],
        ['dailystreak', 'BIGINT DEFAULT 0'],
        ['lastcofre', 'BIGINT DEFAULT 0'],
        ['lastrob', 'BIGINT DEFAULT 0'],
        ['lastslut', 'BIGINT DEFAULT 0'],
        ['timevot', 'BIGINT DEFAULT 0'],
        ['wait', 'BIGINT DEFAULT 0'],
        ['crime', 'BIGINT DEFAULT 0'],
        ['marry', 'TEXT DEFAULT NULL'],
        ['marry_request', 'TEXT DEFAULT NULL'],
        ['razon_ban', 'TEXT'],
        ['avisos_ban', 'INTEGER DEFAULT 0'],
        ['gender', 'TEXT'],
        ['birthday', 'DATE'],
      ];
      for (const [columna, tipo] of columnasUsuarios) {
        await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ${columna} ${tipo}`);
      }

      const columnasCharacters = [
        ['name', 'TEXT'],
        ['url', 'TEXT'],
        ['tipo', 'TEXT'],
        ['anime', 'TEXT'],
        ['rareza', 'TEXT'],
        ['price', 'INTEGER'],
        ['previous_price', 'INTEGER'],
        ['claimed_by', 'TEXT'],
        ['for_sale', 'BOOLEAN DEFAULT false'],
        ['seller', 'TEXT'],
        ['votes', 'INTEGER DEFAULT 0'],
        ['last_removed_time', 'BIGINT'],
      ];
      for (const [columna, tipo] of columnasCharacters) {
        await client.query(`ALTER TABLE characters ADD COLUMN IF NOT EXISTS ${columna} ${tipo}`);
      }

      const columnasSubbots = [
        ['tipo', "TEXT DEFAULT 'null'"],
        ['name', 'TEXT'],
        ['logo_url', 'TEXT'],
        ['prefix', "TEXT[] DEFAULT ARRAY['/', '.', '#']"],
        ['mode', "TEXT DEFAULT 'public'"],
        ['owners', 'TEXT[]'],
        ['anti_private', 'BOOLEAN DEFAULT false'],
        ['anti_call', 'BOOLEAN DEFAULT true'],
        ['privacy', 'BOOLEAN DEFAULT false'],
        ['prestar', 'BOOLEAN DEFAULT false'],
      ];
      for (const [columna, tipo] of columnasSubbots) {
        await client.query(`ALTER TABLE subbots ADD COLUMN IF NOT EXISTS ${columna} ${tipo}`);
      }
    },
  },

  {
    name: '003_token_storage',
    async up(client) {
      // Tabla usada por plugins/_autoresponder.js y plugins/herramientas-chagpt.js
      // como respaldo opcional de GROQ_API_KEY (además de .env).
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_tokens (
          name TEXT PRIMARY KEY,
          token_b64 TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Tabla usada por plugins/so-add-audio.js (token de GitHub, etc.)
      await client.query(`
        CREATE TABLE IF NOT EXISTS tokens (
          id TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    },
  },

  {
    name: '004_indexes',
    async up(client) {
      const indexes = [
        // usuarios
        `CREATE INDEX IF NOT EXISTS idx_usuarios_banned ON usuarios(banned) WHERE banned = true`,
        `CREATE INDEX IF NOT EXISTS idx_usuarios_registered ON usuarios(registered)`,
        `CREATE INDEX IF NOT EXISTS idx_usuarios_marry ON usuarios(marry) WHERE marry IS NOT NULL`,
        `CREATE INDEX IF NOT EXISTS idx_usuarios_warn ON usuarios(warn) WHERE warn > 0`,
        `CREATE INDEX IF NOT EXISTS idx_usuarios_num ON usuarios(num)`,
        `CREATE INDEX IF NOT EXISTS idx_usuarios_dailystreak ON usuarios(dailystreak) WHERE dailystreak > 0`,
        // usuarios.lid ya tiene índice único implícito por el UNIQUE constraint

        // group_settings
        `CREATE INDEX IF NOT EXISTS idx_group_settings_banned ON group_settings(banned) WHERE banned = true`,
        `CREATE INDEX IF NOT EXISTS idx_group_settings_expired ON group_settings(expired) WHERE expired IS NOT NULL AND expired > 0`,
        `CREATE INDEX IF NOT EXISTS idx_group_settings_primary_bot ON group_settings(primary_bot) WHERE primary_bot IS NOT NULL`,

        // chats
        `CREATE INDEX IF NOT EXISTS idx_chats_bot_id ON chats(bot_id)`,
        `CREATE INDEX IF NOT EXISTS idx_chats_group_joined ON chats(is_group, joined)`,

        // messages
        `CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id)`,
        `CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`,

        // characters
        `CREATE INDEX IF NOT EXISTS idx_characters_claimed_by ON characters(claimed_by)`,
        `CREATE INDEX IF NOT EXISTS idx_characters_lower_name ON characters(LOWER(name))`,
        `CREATE INDEX IF NOT EXISTS idx_characters_url ON characters(url)`,
        `CREATE INDEX IF NOT EXISTS idx_characters_for_sale ON characters(for_sale) WHERE for_sale = true`,

        // subbots
        `CREATE INDEX IF NOT EXISTS idx_subbots_tipo ON subbots(tipo)`,

        // chat_memory
        `CREATE INDEX IF NOT EXISTS idx_chat_memory_updated_at ON chat_memory(updated_at)`,

        // reportes
        `CREATE INDEX IF NOT EXISTS idx_reportes_enviado ON reportes(enviado) WHERE enviado = false`,
        `CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(fecha)`,

        // stats
        `CREATE INDEX IF NOT EXISTS idx_stats_count ON stats(count)`,
      ];
      for (const sql of indexes) {
        await client.query(sql);
      }
    },
  },
];

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function runMigrations() {
  const client = await db.connect();
  try {
    await ensureMigrationsTable(client);

    // Lock a nivel de sesión: bloquea hasta obtenerlo, evitando que dos
    // procesos (bot principal + subbots) corran migraciones a la vez.
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATIONS_LOCK_KEY]);

    try {
      const { rows } = await client.query('SELECT version FROM schema_migrations');
      const applied = new Set(rows.map((r) => r.version));

      for (const migration of MIGRATIONS) {
        if (applied.has(migration.name)) continue;

        await client.query('BEGIN');
        try {
          await migration.up(client);
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
            [migration.name]
          );
          await client.query('COMMIT');
          console.log(`[DB] ✅ Migración aplicada: ${migration.name}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw new Error(`[DB] Falló la migración "${migration.name}": ${err.message}`);
        }
      }
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATIONS_LOCK_KEY]);
    }
  } finally {
    client.release();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// dbReady — promesa que resuelve cuando la base está lista (conexión +
// migraciones aplicadas). main.js debe hacer `await dbReady` ANTES de
// cargar plugins o aceptar mensajes. Si falla, el arranque debe abortar.
// ═══════════════════════════════════════════════════════════════════════
export const dbReady = (async () => {
  try {
    await db.query('SELECT 1');
    await runMigrations();
    console.log('[DB] ✅ PostgreSQL conectado y esquema al día (12 tablas).');
    return true;
  } catch (err) {
    console.error('[DB] ❌ ERROR FATAL preparando la base de datos:', err.message);
    throw err;
  }
})();

// ═══════════════════════════════════════════════════════════════════════
// getSubbotConfig — con cache en memoria (TTL ~10s) para evitar abrir
// una query nueva por cada mensaje/comando procesado.
// ═══════════════════════════════════════════════════════════════════════
const SUBBOT_CACHE_TTL_MS = 10_000;
const subbotConfigCache = new Map(); // cleanId -> { data, expiresAt }

const DEFAULT_SUBBOT_CONFIG = Object.freeze({
  prefix: ['/', '.', '#'],
  mode: 'public',
  anti_private: true,
  anti_call: false,
  owners: [],
  name: null,
  logo_url: null,
  privacy: null,
  prestar: null,
  tipo: null,
});

export async function getSubbotConfig(botId) {
  const cleanId = (botId || '').replace(/:\d+/, '');
  const cached = subbotConfigCache.get(cleanId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const res = await db.query('SELECT * FROM subbots WHERE id = $1', [cleanId]);
    const data = res.rows.length > 0 ? res.rows[0] : { ...DEFAULT_SUBBOT_CONFIG };
    subbotConfigCache.set(cleanId, { data, expiresAt: Date.now() + SUBBOT_CACHE_TTL_MS });
    return data;
  } catch (err) {
    console.error('❌ Error al obtener configuración del subbot desde DB:', err.message);
    // No cacheamos el fallback de error para reintentar pronto en la siguiente llamada.
    return { ...DEFAULT_SUBBOT_CONFIG };
  }
}

// Debe llamarse siempre que se mute subbots.prefix/mode/owners/name/logo_url/
// privacy/prestar/anti_private/anti_call para ese botId (o sin argumentos
// para limpiar todo el cache).
export function invalidateSubbotConfig(botId) {
  if (!botId) {
    subbotConfigCache.clear();
    return;
  }
  const cleanId = botId.replace(/:\d+/, '');
  subbotConfigCache.delete(cleanId);
}

export async function closeDatabase() {
  await db.end();
}
