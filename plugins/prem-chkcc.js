import { luhnCheck } from '../lib/validators.js';
const ccCache = new Map();

async function getBinInfo(bin) {
    const endpoints = [
        `https://lookup.binlist.net/${bin}`,
        `https://binlist-data.vercel.app/api/${bin}`,
        `https://api.bincodes.net/bin/?format=json&bin=${bin}`,
        `https://bincheck.io/api/${bin}`,
        `https://binlookup.com/api/${bin}`,
        `https://bin.info/api/${bin}`
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            if (data && data.scheme) return data;
        } catch (e) {
            continue;
        }
    }
    return null;
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Lista de chats permitidos (3 veces cada uno)
    const allowedChats = [
        '120363029095838594@g.us',
        '5217121649714@s.whatsapp.net',
        '120363395620702716@g.us',
        '5217121649714@s.whatsapp.net',
        '120363395620702716@g.us',
        '5217121649714@s.whatsapp.net'
    ];

    // Verificar si el chat está permitido
    if (!allowedChats.includes(m.chat)) {
        await conn.sendMessage(m.chat, { 
            text: '❌ Este comando solo se puede usar en grupos o chats permitidos.\n\nContacta a wa.me/5217121649714'
        }, { quoted: m });
        return;
    }

    const cooldown = 30000;
    const lastCommand = conn.chkcc = conn.chkcc || {};

    if (!text) throw `⚠️ Formato correcto:\n${usedPrefix}${command} cc|mm|dd|vv`;

    const ccRegex = /^((?:\d{15}|\d{16}))\|(\d{1,2})\|(\d{2,4})\|(\d{3,4})$/;
    const match = text.match(ccRegex);
    if (!match) throw '❌ Formato de CC inválido';

    let [ , cc, mes, año, cvv ] = match;

    if (cc.length === 15) {
        if (!(cc.startsWith('34') || cc.startsWith('37'))) {
            throw '❌ Formato de tarjeta inválido';
        }
        if (cvv.length !== 4) {
            ccCache.set(cc, { status: '❌ Declined!!', response: 'Error: CVV inválido para Amex', timestamp: Date.now(), luhnValid: false });
        }
    } else if (cc.length === 16) {
        if (cvv.length !== 3) {
            ccCache.set(cc, { status: '❌ Declined!!', response: 'Error: CVV inválido', timestamp: Date.now(), luhnValid: false });
        }
    } else {
        throw '❌ Formato de tarjeta inválido';
    }

    let expYear = parseInt(año, 10);
    if (año.length === 2) {
        expYear += 2000;
    }
    let expMonth = parseInt(mes, 10);
    if (expMonth < 1 || expMonth > 12) {
        throw '❌ Formato de mes inválido';
    }
    const now = new Date();
    const expirationDate = new Date(expYear, expMonth, 0);
    if (now > expirationDate) {
        ccCache.set(cc, { status: '❌ Declined!!', response: 'Error: Tarjeta expirada', timestamp: Date.now(), luhnValid: false });
    }

    const isValidLuhn = luhnCheck(cc);
    const startTime = Date.now();

    const gateways = ['Stripe [ Auth ]', 'Cybersource [ Auth ]', 'Braintree [ Auth ]'];
    const selectedGateway = gateways[Math.floor(Math.random() * gateways.length)];

    if (lastCommand[m.sender] && Date.now() - lastCommand[m.sender] < cooldown) {
        await m.reply(`⏱️ Espera ${Math.ceil((cooldown - (Date.now() - lastCommand[m.sender])) / 1000)} segundos antes de otro check.`);
        return;
    }

    let cachedResponse = null;
    if (ccCache.has(cc)) {
        const cached = ccCache.get(cc);
        if (Date.now() - cached.timestamp < 172800000) {
            cachedResponse = cached;
        }
    }

    const bin = cc.substring(0, 6);
    let binData = null;
    try {
        binData = await getBinInfo(bin);
    } catch (e) {
        binData = null;
    }

    const originalMessage = await conn.sendMessage(m.chat, {
        text: `⚡ *Verificando API...*\n\n💎 Gateway: ${selectedGateway}\n\n💳 CC: ${cc}|${mes}|${año}|${cvv}`,
    }, { quoted: m });

    const colorStages = ['🟠', '🟢', '🔵', '🟣'];
    let editCount = 0;
    let finished = false;

    const updateMessage = async (gateway) => {
        if (finished || editCount >= 4) return;

        const statusMessages = [  
            `CHECKING CARD [█░░░░░]`,  
            `CHECKING CARD [██░░░░]`,  
            `CHECKING CARD [████░░]`,  
            `CHECKING CARD [█████░]`  
        ];  

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);  
        const color = colorStages[editCount] || '🟡';  

        await conn.sendMessage(m.chat, {  
            text: `${color} *:* ${statusMessages[editCount]}\n\n↯ Gateway: ${gateway}\n\n↯ CC: ${cc}|${mes}|${año}|${cvv}\n\n↯ Tiempo transcurrido: ${elapsed}s`,  
            edit: originalMessage.key  
        });  

        editCount++;  
        setTimeout(() => updateMessage(gateway), Math.random() * 7000 + 5000);
    };

    updateMessage(selectedGateway);

    setTimeout(async () => {
        finished = true;
        let status, response;

        const approvedMessages = [
            '✅ Approved - Code 00: Transaction approved',
            '✅ Approved - Code 01: Approved after verification',
            '✅ Approved - Code 10: Partial authorization',
            '✅ Approved - Under review by Fraud Service',
            '✅ Approved - Payment error: CVV2 DECLINED',
            '✅ Approved - APPROVED',
            '✅ Approved - INV CVV2 MATCH',
        ];

        const declinedMessages = [
            '❌ Declined - Code 05: Do not honor',
            '❌ Declined - Code 14: Invalid card number',
            '❌ Declined - Code 51: Insufficient funds',
            '❌ Declined - Code 54: Expired card',
            '❌ Declined - Your card was declined.',
            '❌ Declined - SERV NOT ALLOWED. DECLINE',
            '❌ Declined - Invalid expiration date',
        ];

        if (cachedResponse) {  
            status = cachedResponse.status;  
            response = cachedResponse.response;  
        } else {  
            if (!isValidLuhn) {  
                status = '❌ Declined!!';  
                response = 'Error: Tarjeta inválida';  
            } else {  
                const isApproved = Math.random() < 0.3;  
                status = isApproved 
                    ? approvedMessages[Math.floor(Math.random() * approvedMessages.length)] 
                    : declinedMessages[Math.floor(Math.random() * declinedMessages.length)];  
                response = isApproved ? 'Approved' : 'Declined';  
            }  
            ccCache.set(cc, {  
                status,  
                response,  
                timestamp: Date.now(),  
                luhnValid: isValidLuhn  
            });  
        }  

        let binInfoText = '';  
        if (binData) {  
            const bank = binData.bank?.name || 'N/A';  
            const scheme = binData.scheme ? binData.scheme.toUpperCase() : 'N/A';  
            const type = binData.type || 'N/A';  
            const country = binData.country?.name || 'N/A';  
            binInfoText = `\n\n*↯BIN Info:*\n• Banco: ${bank}\n• Marca: ${scheme}\n• Tipo: ${type}\n• País: ${country}`;  
        }  

        await conn.sendMessage(m.chat, {   
            text: `━━━━━━━━━━━━━━\n> KANTU  BOT CHK\n━━━━━━━━━━━━━━\n\nGateway: ⚡ ${selectedGateway}\n• CC: \`${cc}|${mes}|${año}|${cvv}\`\n• Status: ${status}\n• Response: ${response}\n• Tiempo: ${((Date.now() - startTime) / 1000).toFixed(2)}s\n• Checked By: @${m.sender.split('@')[0]}${binInfoText}\n\n> https://hackstorex.com`,  
            mentions: [m.sender],  
            edit: originalMessage.key  
        });  

        lastCommand[m.sender] = Date.now();
    }, 35000 + Math.random() * 15000);
};

handler.help = ['chkcc <cc>'];
handler.tags = ['tools'];
handler.command = /^chk(cc)?$/i;
export default handler;