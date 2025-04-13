import ws from 'ws';

// Caché local para metadatos de grupos
const groupMetadataCache = {};

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  try {
    // Verificar que chat existe antes de usarlo
    let chat = global.db.data.chats[m.chat] || {};
    let user = global.db.data.users[m.sender] || {};
    let setting = global.db.data.settings[this.user.jid] || {};
    
    // Usar setting con verificación
    let prefixRegex = new RegExp('^[' + (setting.prefix || '').replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');
    
    const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];
    
    // ===== IMPLEMENTACIÓN CON CACHÉ PARA EVITAR RATE LIMITS =====
    let participants = [];
    if (m.isGroup) {
      // Verificar si ya tenemos el metadata en caché
      if (groupMetadataCache[m.chat] && (Date.now() - groupMetadataCache[m.chat].timestamp < 60000)) {
        // Usar caché si existe y no ha expirado (60 segundos)
        participants = groupMetadataCache[m.chat].participants;
      } else {
        try {
          // Si no está en caché o expiró, hacer la llamada a la API
          const metadata = await conn.groupMetadata(m.chat).catch(e => ({}));
          if (metadata && metadata.participants) {
            participants = metadata.participants;
            // Guardar en caché con timestamp
            groupMetadataCache[m.chat] = {
              participants: metadata.participants,
              timestamp: Date.now()
            };
          }
        } catch (e) {
          console.error('Error al obtener metadata del grupo:', e);
          // En caso de error, usar los datos que ya tengamos
          participants = (conn.chats[m.chat] || {}).participants || [];
        }
      }
    }
    
    // Optimizar las búsquedas con Map para mejor rendimiento
    const participantsMap = new Map(participants.map(p => [p.id, p]));
    
    const mainBotInGroup = participantsMap.has(global.conn.user.jid);
    
    // Verificar que chat.primaryBot existe antes de acceder
    const primaryBot = chat.primaryBot || null;
    const primaryBotConnected = primaryBot ? users.some(conn => conn.user.jid === primaryBot) : false;
    const primaryBotInGroup = primaryBot ? participantsMap.has(primaryBot) : false;
      
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {};
    if (!global.db.data.users[m.sender].mensaje) global.db.data.users[m.sender].mensaje = {};
    if (!global.db.data.users[m.sender].mensaje[m.chat]) global.db.data.users[m.sender].mensaje[m.chat] = 0;
    global.db.data.users[m.sender].mensaje[m.chat]++;

    if (m.isGroup) {
      if (primaryBot) {
        if (primaryBotConnected && primaryBotInGroup) {
          if (this.user.jid !== primaryBot) throw !1; 
        }
        else if (mainBotInGroup) {
          if (this.user.jid !== global.conn.user.jid) throw !1;
        }
      }
    }

    if (m.fromMe) return
    if (m.isGroup) return !1
    if (!m.message) return !0 
    if (["120363371008200788@newsletter", "120363371008200788@newsletter"].includes(m.chat)) return;
    
    // Usar expresiones regulares para comprobaciones más eficientes
    const allowedTerms = /PIEDRA|PAPEL|TIJERA|menu|estado|code|Code|bots|serbot|jadibot|reg|verificar|Serbot|Jadibot|jadibot code|serbot code|jadibot --code|serbot --code/i;
    if (m.text && allowedTerms.test(m.text)) return !0;
    
    if (!user.warnPv) user.warnPv = false;

    // Verificar que setting existe antes de usar antiPrivate
    if (setting && setting.antiPrivate && !isOwner && !isROwner) {
      if (user.warnPv) {
        console.log(`[AntiPrivate]`);
        throw !1; 
      }

      if (!user.warnPv) {
        // Verificar que nna2 está definido, o usar un valor predeterminado
        const nna2 = global.nna2 || 'https://chat.whatsapp.com/grupo_oficial';
        m.reply(`Hola, está prohibido usar los comandos en privado...\n\n*\`🔰 SI QUIERES HACERTE UN SUB BOT, USA LOS SIGUIENTES COMANDOS:\`*\n/serbot\n/code\n\n> _*Para usar mis funciones, únete al grupo oficial 👇*_\n${nna2}`);
        user.warnPv = true;
        throw !1; 
      }
    }

    if (m.text && prefixRegex.test(m.text)) {
      this.sendPresenceUpdate('composing', m.chat)
      this.readMessages([m.key])
          
      let usedPrefix = m.text.match(prefixRegex)[0]
      let command = m.text.slice(usedPrefix.length).trim().split(' ')[0]
    }
  } catch (error) {
    // Si el error es rate-limit, manejarlo silenciosamente
    if (error.message && error.message.includes('rate-overlimit')) {
      console.log('[RATE LIMIT] Detectado rate limit en _antiprivado.js, esperando...');
      return !1; // Continuar sin bloquear la ejecución
    }
    // Para otros errores, lanzarlos normalmente
    throw error;
  }
}
