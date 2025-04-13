import fs from 'fs';
import path from 'path';

const auctionFilePath = path.resolve('./src/auctions.json');

// Función para cargar subastas
const loadAuctions = () => {
    try {
        if (!fs.existsSync(auctionFilePath)) {
            fs.writeFileSync(auctionFilePath, JSON.stringify({auctions: []}, null, 2));
            return {auctions: []};
        }
        const data = fs.readFileSync(auctionFilePath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("❌ Error al cargar las subastas:", err.message);
        return {auctions: []};
    }
};

// Función para guardar subastas
const saveAuctions = (auctionData) => {
    try {
        fs.writeFileSync(auctionFilePath, JSON.stringify(auctionData, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Error al guardar las subastas:", err.message);
        return false;
    }
};

// Función para generar ID único
const generateAuctionId = () => {
    return 'AUC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Función para formatear tiempo
const formatTime = (hours) => {
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} días y ${remainingHours} horas`;
};

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`╭━━━[ *CREAR SUBASTA* ]━━━⬣
┃
┃ ⚠️ Formato:
┃ ${usedPrefix}${command} premio|precio inicial|precio directo
┃
┃ 📌 Ejemplo:
┃ ${usedPrefix}${command} Diamantes x1000|5000|15000
┃
┃ 📋 Notas:
┃ • Premio: Lo que se subasta
┃ • Precio Inicial: Precio base
┃ • Precio Directo: Compra inmediata
┃ • Tiempo inicial: 24 horas
┃ • +3 horas por cada puja
╰━━━━━━━━━━━━━━━⬣`);
    }

    try {
        const [prize, startingBid, buyNow] = text.split('|');

        if (!prize || !startingBid || !buyNow) {
            return m.reply('⚠️ Debes proporcionar todos los datos');
        }

        // Validar precios
        const initialPrice = parseInt(startingBid);
        const directPrice = parseInt(buyNow);

        if (isNaN(initialPrice) || isNaN(directPrice)) {
            return m.reply('⚠️ Los precios deben ser números válidos');
        }

        if (initialPrice <= 0 || directPrice <= 0) {
            return m.reply('⚠️ Los precios deben ser mayores a 0');
        }

        if (initialPrice >= directPrice) {
            return m.reply('⚠️ El precio inicial debe ser menor al precio directo');
        }

        // Generar ID único
        const auctionId = generateAuctionId();
        
        // Tiempo inicial en horas
        const initialHours = 24;

        // Crear nueva subasta
        const newAuction = {
            auctionId: auctionId,
            item: prize.trim(),
            startingPrice: initialPrice,
            buyNowPrice: directPrice,
            currentPrice: initialPrice,
            createdBy: m.sender,
            createdAt: new Date().toISOString(),
            endTime: new Date(Date.now() + initialHours * 60 * 60 * 1000).toISOString(),
            remainingHours: initialHours,
            status: 'active',
            participants: [],
            lastBidder: null,
            bids: []
        };

        // Cargar y guardar subasta
        let auctionData = loadAuctions();
        auctionData.auctions.push(newAuction);

        if (saveAuctions(auctionData)) {
            // Mensaje de confirmación
            let auctionMsg = `╭━━━[ *NUEVA SUBASTA* ]━━━⬣
┃
┃ 🔖 *ID:* ${auctionId}
┃
┃ 🎁 *Premio:* 
┃ ${prize.trim()}
┃
┃ 💰 *Precio Inicial:* 
┃ ${initialPrice.toLocaleString()} USD
┃
┃ 💎 *Precio Directo:* 
┃ ${directPrice.toLocaleString()} USD
┃
┃ ⏳ *Duración Inicial:* 
┃ ${formatTime(initialHours)}
┃
┃ 📌 *Información:*
┃ • Cada puja añade 3 horas
┃ • Precio mínimo de puja:
┃   1 USD
┃
┃ 📍 *Comandos:*
┃ • Para pujar:
┃ .bid ${auctionId} <cantidad>
┃
┃ • Compra directa:
┃ .buynow ${auctionId}
┃
┃ • Ver info:
┃ .auctioninfo ${auctionId}
╰━━━━━━━━━━━━━━━⬣`;

            // Mensaje inicial
            await conn.reply(m.chat, auctionMsg, m);

            // Mensaje separado con ID
            await conn.reply(m.chat, `🔖 *ID DE SUBASTA:* ${auctionId}`, m);

        } else {
            throw new Error('Error al crear la subasta');
        }

    } catch (error) {
        console.error(error);
        return m.reply(`❌ Error al crear la subasta: ${error.message}`);
    }
};

handler.help = ['.auction <premio|precio inicial|precio directo>'];
handler.tags = ['economy'];
handler.command = /^(auction|subasta|createauction)$/i;
handler.group = false;
handler.rowner = true;

export default handler;
