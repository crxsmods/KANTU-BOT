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

// Función para formatear tiempo
const formatTime = (hours) => {
    if (hours < 24) return `${Math.floor(hours)} horas y ${Math.floor((hours % 1) * 60)} minutos`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} días y ${Math.floor(remainingHours)} horas`;
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (args.length < 2) {
        return m.reply(`╭━━━[ *PUJAR EN SUBASTA* ]━━━⬣
┃
┃ ⚠️ Formato:
┃ ${usedPrefix}${command} <ID> <cantidad>
┃
┃ 📌 Ejemplo:
┃ ${usedPrefix}${command} AUC-1A2B3C 6
┃
┃ 📋 Notas:
┃ • La puja debe superar la actual
┃ • Mínimo 1 de la puja actual
┃ • Cada puja añade 3 horas
╰━━━━━━━━━━━━━━━⬣`);
    }

    try {
        const auctionId = args[0];
        const bidAmount = parseInt(args[1]);

        // Validar cantidad
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return m.reply('⚠️ La cantidad debe ser un número válido');
        }

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

        // Verificar precio mínimo
        if (bidAmount <= auction.currentPrice) {
            return m.reply(`❌ Tu puja debe ser mayor al precio actual: ${auction.currentPrice}`);
        }

        if (bidAmount < auction.currentPrice + 1) {
            return m.reply(`❌ La puja mínima debe ser ${auction.currentPrice + 1} USD`);
        }

        // Verificar que no sea el último postor
        if (auction.lastBidder === m.sender) {
            return m.reply('❌ Ya tienes la puja más alta');
        }

        // Verificar balance del usuario
        const user = global.db.data.users[m.sender];
        if (!user || user.money < bidAmount) {
            return m.reply('❌ No tienes suficientes coins para esta puja');
        }

        // Realizar la puja
        // Devolver coins al anterior postor si existe
        if (auction.lastBidder) {
            global.db.data.users[auction.lastBidder].money += auction.currentPrice;
        }

        // Descontar coins al nuevo postor
        user.money -= bidAmount;

        // Actualizar subasta
        auction.currentPrice = bidAmount;
        auction.lastBidder = m.sender;
        auction.bids.push({
            bidder: m.sender,
            amount: bidAmount,
            time: new Date().toISOString()
        });

        // Añadir 3 horas
        const newEndTime = new Date(endTime.getTime() + (3 * 60 * 60 * 1000));
        auction.endTime = newEndTime.toISOString();
        auction.remainingHours = (newEndTime - now) / (1000 * 60 * 60);

        // Guardar cambios
        if (saveAuctions(auctionData)) {
            // Mensaje de puja exitosa
            let bidMsg = `╭━━━[ *PUJA REALIZADA* ]━━━⬣
┃
┃ 🔖 *ID:* ${auctionId}
┃ 
┃ 🎁 *Premio:* 
┃ ${auction.item}
┃
┃ 💰 *Nueva puja:* 
┃ ${bidAmount.toLocaleString()} USD
┃
┃ 👤 *Postor:* 
┃ @${m.sender.split('@')[0]}
┃
┃ ⏳ *Tiempo añadido:* +3 horas
┃ 
┃ ⌛ *Tiempo restante:*
┃ ${formatTime(auction.remainingHours)}
┃
┃ 📊 *Pujas totales:* 
┃ ${auction.bids.length}
╰━━━━━━━━━━━━━━━⬣`;

            await conn.reply(m.chat, bidMsg, m, {
                mentions: [m.sender]
            });

        } else {
            throw new Error('Error al actualizar la subasta');
        }

    } catch (error) {
        console.error(error);
        return m.reply(`❌ Error al realizar la puja: ${error.message}`);
    }
};

handler.help = ['.bid <ID> <cantidad>'];
handler.tags = ['economy'];
handler.command = /^(bid|pujar)$/i;
handler.group = true;
handler.register = true;

export default handler;
