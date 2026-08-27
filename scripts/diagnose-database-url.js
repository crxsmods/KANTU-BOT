// ═══════════════════════════════════════════════════════════════════════
// scripts/diagnose-database-url.js — Diagnóstico de DATABASE_URL
// Uso: node scripts/diagnose-database-url.js
// NUNCA imprime la URL real ni la contraseña. Solo indica qué está mal.
// ═══════════════════════════════════════════════════════════════════════
import dotenv from 'dotenv';
dotenv.config();

const raw = process.env.DATABASE_URL;
console.log('\n=== Diagnóstico de DATABASE_URL ===\n');

if (raw === undefined) {
  console.log('  ✖ DATABASE_URL no existe en el entorno / .env.');
  console.log('    → Crea un archivo .env junto a package.json con:');
  console.log('      DATABASE_URL=postgres://usuario:contraseña@host:5432/basededatos');
  process.exit(1);
}

console.log(`  • Longitud del valor: ${raw.length} caracteres`);
console.log(`  • ¿Tiene comillas envolventes ("..." o '...')?  ${/^".*"$|^'.*'$/.test(raw.trim()) ? 'SÍ ⚠️ (quítalas)' : 'No'}`);
console.log(`  • ¿Tiene espacios o saltos de línea?            ${/\s/.test(raw) ? 'SÍ ⚠️' : 'No'}`);
console.log(`  • ¿Empieza con postgres:// o postgresql://?     ${/^\s*["']?postgres(ql)?:\/\//i.test(raw) ? 'Sí' : 'NO ⚠️'}`);

let cleaned = raw.trim();
if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
  cleaned = cleaned.slice(1, -1).trim();
}

try {
  const u = new URL(cleaned);
  console.log('  ✔ La URL es parseable correctamente.');
  console.log(`  • Protocolo: ${u.protocol}`);
  console.log(`  • Host: ${u.hostname ? '(presente, oculto)' : 'VACÍO ⚠️'}`);
  console.log(`  • Puerto: ${u.port || '(por defecto 5432)'}`);
  console.log(`  • Usuario: ${u.username ? '(presente, oculto)' : 'VACÍO ⚠️'}`);
  console.log(`  • Contraseña: ${u.password ? '(presente, oculta)' : 'VACÍA ⚠️ (revisa si tenía caracteres especiales sin codificar)'}`);
  console.log(`  • Base de datos: ${u.pathname && u.pathname !== '/' ? '(presente, oculta)' : 'VACÍA ⚠️'}`);
  console.log('\n  ✅ Formato válido. Si sigue fallando la conexión real, revisa:');
  console.log('     - Que el host/puerto sean accesibles desde este servidor (firewall, IP allowlist en Supabase).');
  console.log('     - Que uses el connection string correcto (Session pooler / Direct connection) de Supabase.');
} catch (err) {
  console.log('  ✖ La URL NO es parseable.');
  console.log('    Causa más común: la contraseña tiene caracteres especiales sin percent-encoding.');
  console.log('    Debes codificar en la contraseña: @ → %40, # → %23, : → %3A, / → %2F, % → %25, espacio → %20');
  console.log('    Ejemplo correcto: postgres://usuario:mi%40clave%23123@host:5432/basededatos');
  process.exit(1);
}

console.log('');
