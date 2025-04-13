import fs from 'fs';
import path from 'path';

const auctionFilePath = path.resolve('./src/auctions.json');

// Función para cargar subastas
const loadAuctions = () => {
    try {
        if (!fs.existsSync(auctionFilePath)) return { auctions: [] };
        return JSON.parse(fs.readFileSync(auctionFilePath));
    } catch (err) {
        console.error("❌ Error al cargar subastas:", err);
        return { auctions: [] };
    }
};

// Función para guardar subastas
const saveAuctions = (auctionData) => {
    try {
        fs.writeFileSync(auctionFilePath, JSON.stringify(auctionData, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Error al guardar subastas:", err);
        return false;
    }
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) {
        return m.reply(`╭━━━[ *COMPRA DIRECTA* ]━━━⬣
┃
┃ ⚠️ Formato:
┃ ${usedPrefix}${command} <ID>
┃
┃ 📌 Ejemplo:
┃ ${usedPrefix}${command} AUC-1A2B3C
┃
┃ 📋 Notas:
┃ • Necesitas el precio directo o más
┃ • La subasta terminará al instante
┃ • No hay devoluciones
╰━━━━━━━━━━━━━━━⬣`);
    }

    try {
        const auctionId = args[0];

        // Cargar subastas
        let auctionData = loadAuctions();
        let auction = auctionData.auctions.find(a => a.auctionId === auctionId);

        if (!auction) {
            return m.reply('❌ Subasta no encontrada');
        }

        // Verificar estado de la subasta
        if (auction.status !== 'active') {
            return m.reply('❌ Esta subasta ya ha finalizado');
        }

        // Verificar tiempo
        const now = new Date();
        const endTime = new Date(auction.endTime);
        if (now > endTime) {
            auction.status = 'ended';
            saveAuctions(auctionData);
            return m.reply('❌ Esta subasta ya ha expirado');
        }

        // Verificar balance del usuario
        const user = global.db.data.users[m.sender];
        if (!user || user.money < auction.buyNowPrice) {
            return m.reply(`❌ No tienes suficientes USD para la compra directa\n\n💰 Precio: ${auction.buyNowPrice.toLocaleString()} USD`);
        }

        // Descontar el dinero necesario
        user.money -= auction.buyNowPrice;

        // Devolver coins al último postor si existe
        if (auction.lastBidder) {
            global.db.data.users[auction.lastBidder].money += auction.currentPrice;
        }

        // Realizar la compra
        auction.currentPrice = auction.buyNowPrice;
        auction.lastBidder = m.sender;
        auction.status = 'completed';
        auction.endTime = new Date().toISOString();
        auction.winner = m.sender;
        auction.bids.push({
            bidder: m.sender,
            amount: auction.buyNowPrice,
            time: new Date().toISOString(),
            type: 'buynow'
        });

        // Guardar cambios
        if (saveAuctions(auctionData)) {
            // Mensaje de compra exitosa
            let buyMsg = `╭━━━[ *COMPRA DIRECTA EXITOSA* ]━━━⬣
┃
┃ 🎊 *¡FELICIDADES!* 🎊
┃
┃ 🔖 *ID:* ${auctionId}
┃ 
┃ 🎁 *Premio:* 
┃ ${auction.item}
┃
┃ 💎 *Precio pagado:* 
┃ ${auction.buyNowPrice.toLocaleString()} USD
┃
┃ 👤 *Comprador:* 
┃ @${m.sender.split('@')[0]}
┃
┃ 📍 *Estado:* Completada
┃
┃ ⭐ *Tipo:* Compra Directa
╰━━━━━━━━━━━━━━━⬣`;

            // Mensaje en el grupo
            await conn.reply(m.chat, buyMsg, m, {
                mentions: [m.sender]
            });

            // Notificar al creador de la subasta
            let creatorMsg = `╭━━━[ *SUBASTA COMPLETADA* ]━━━⬣
┃
┃ 🔖 *ID:* ${auctionId}
┃ 
┃ 🎁 *Tu premio:*
┃ ${auction.item}
┃
┃ 💎 *Fue comprado por:*
┃ @${m.sender.split('@')[0]}
┃
┃ 💰 *Precio final:*
┃ ${auction.buyNowPrice.toLocaleString()} USD
╰━━━━━━━━━━━━━━━⬣`;

            await conn.sendMessage(auction.createdBy, { 
                text: creatorMsg,
                mentions: [m.sender]
            });

        } else {
            throw new Error('Error al finalizar la subasta');
        }

    } catch (error) {
        console.error(error);
        return m.reply(`❌ Error al realizar la compra: ${error.message}`);
    }
};

handler.help = ['.buynow <ID>'];
handler.tags = ['economy'];
handler.command = /^(buynow)$/i;
handler.group = true;
handler.register = true;

export default handler;