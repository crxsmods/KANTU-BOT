# Kantu Bot

Bot de WhatsApp Multi-Device hecho con Baileys y Node.js 24.

## Instalacion

Requisitos: Node.js 24, npm 11 y FFmpeg.

```bash
cp .env.example .env
npm ci
npm start
```

En `.env` pon tu numero en `BOT_OWNERS`. Es lo unico obligatorio.

## Vinculacion

En el primer arranque el bot pregunta en la consola: escribe `1` para el codigo
QR o `2` para el codigo de 8 digitos. Con la opcion `2` pide el numero en
digitos y sin `+` (ejemplo: `521568888888`). Funciona igual en paneles como
Pterodactyl.

Conserva las carpetas `BotSession`, `jadibot`, `data` y `database` en
almacenamiento persistente; ahi viven la sesion y los datos.

## Base de datos

No hace falta configurar ninguna. Sin `DATABASE_URL` el bot crea una base
PostgreSQL embebida en `./database` al primer arranque: descargas, ejecutas y
funciona. Los datos son de esa instalacion y no salen de la maquina.

Si prefieres una base propia (Supabase, Neon, PostgreSQL local), define
`DATABASE_URL` y tendra prioridad sobre la local.

## Docker

```bash
docker compose build
docker compose up -d
docker compose logs -f kantu-bot
```

Health checks: `GET /health/live` y `GET /health/ready`.

## Comprobaciones

```bash
npm test
npm run lint
npm run check:production
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
