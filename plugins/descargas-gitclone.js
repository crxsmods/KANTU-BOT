import fetch from 'node-fetch';
const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
const userCaptions = new Map();
const userRequests = {};

let handler = async (m, { args, usedPrefix, command, conn }) => {
    // 1. Mensaje de uso correcto
    const usage = `「📦」 *CLONADOR DE REPOSITORIOS*\n\n` +
        `> _Ingrese un enlace de GitHub para descargar el código fuente en formato .zip_\n\n` +
        `📌 *EJEMPLO:* \n` +
        `↳ ${usedPrefix + command} https://github.com/usuario/repositorio`;

    if (!args[0]) throw usage;
    
    // 2. Validación de enlace profesional
    if (!regex.test(args[0])) return m.reply(`「⚠️」 *Enlace Inválido*\n\nEl link proporcionado no pertenece a un repositorio de GitHub válido.`);

    // 3. Control de spam/solicitudes
    if (userRequests[m.sender]) {
        return conn.reply(m.chat, `「⏳」 *Solicitud en curso*\n\n@${m.sender.split('@')[0]}, ya estoy procesando una descarga para ti. Por favor, espera a que finalice.`, userCaptions.get(m.sender) || m, { mentions: [m.sender] });
    }

    userRequests[m.sender] = true;

    try {   
        // 4. Mensaje de preparación (ExternalAdReply)
        const downloadGit = await conn.reply(m.chat, `「📂」 *PREPARANDO ARCHIVO*\n\n> _Estamos comprimiendo el repositorio. Si el archivo es demasiado pesado, el envío podría fallar._`, m, {
            contextInfo: { 
                externalAdReply: { 
                    mediaUrl: null, 
                    mediaType: 1, 
                    description: null, 
                    title: 'GITHUB DOWNLOADER', 
                    body: 'Repositorio de Software vía WhatsApp', 
                    previewType: 0, 
                    thumbnail: m.pp, 
                    sourceUrl: args[0]
                }
            }
        });   

        userCaptions.set(m.sender, downloadGit);
        
        let [_, user, repo] = args[0].match(regex) || [];
        repo = repo.replace(/.git$/, '');
        let url = `https://api.github.com/repos/${user}/${repo}/zipball`;
        
        // Obtener nombre del archivo desde la cabecera
        let response = await fetch(url, { method: 'HEAD' });
        let filename = response.headers.get('content-disposition').match(/attachment; filename=(.*)/)[1];

        // Envío del archivo
        await conn.sendFile(m.chat, url, filename, null, m);

    } catch (e) { 
        // 5. Mensaje de error técnico
        m.reply(`「❌」 *ERROR DEL SISTEMA*\n\nNo se pudo obtener el repositorio. Es posible que sea privado o que el enlace sea incorrecto.\n\n> *Detalle:* ${e.message}`);       
        console.log(e);
        handler.limit = 0; 
    } finally {
        delete userRequests[m.sender];
    }
};

handler.help = ['gitclone <url>'];
handler.tags = ['downloader'];
handler.command = /gitclone|clonarepo|clonarrepo|repoclonar/i;
handler.register = true;
handler.limit = 2;
handler.level = 1;

export default handler;
