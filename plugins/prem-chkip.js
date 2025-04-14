import fetch from 'node-fetch';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return conn.reply(m.chat, `*💎 Ingrese una dirección IP válida para obtener información detallada.*\n*🐼 Ejemplo de uso:* ${usedPrefix + command} 8.8.8.8`, m)
    
    let ip = args[0];
    if (!ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) return conn.reply(m.chat, '💎 El formato de la dirección IP no es válido. Ingrese una IP válida como 8.8.8.8.', m);

    await m.react('🕓');  // Reacción al canal adecuado

    try {
        // Consultas a múltiples APIs
        let api1, api2, api3, api4, api5;

        try {
            api1 = await fetch(`http://ip-api.com/json/${ip}`);
            api1 = await api1.json();
        } catch (e) {
            console.log(`Error con ip-api: ${e.message}`);
        }

        try {
            api2 = await fetch(`https://ipwhois.app/json/${ip}`);
            api2 = await api2.json();
        } catch (e) {
            console.log(`Error con ipwhois: ${e.message}`);
        }

        try {
            api3 = await fetch(`https://ipinfo.io/${ip}/json`);
            api3 = await api3.json();
        } catch (e) {
            console.log(`Error con ipinfo: ${e.message}`);
        }

        try {
            api4 = await fetch(`https://freegeoip.app/json/${ip}`);
            api4 = await api4.json();
        } catch (e) {
            console.log(`Error con freegeoip: ${e.message}`);
        }

        try {
            api5 = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose=yes`, {
                headers: { 'Key': 'YOUR_API_KEY' }  // AbuseIPDB requiere API Key
            });
            api5 = await api5.json();
        } catch (e) {
            console.log(`Error con AbuseIPDB: ${e.message}`);
        }

        // Validar si alguna API respondió correctamente
        if (!api1 && !api2 && !api3 && !api4 && !api5) {
            return conn.reply(m.chat, '🚨 No se pudo obtener la información de la IP en ninguna fuente.', m);
        }

        let flag = api1 ? `https://countryflagsapi.com/png/${api1.countryCode.toLowerCase()}` : '';
        let info = `乂  *IP Checker - CrxsMods么*\n`;
            info += `Script By https://CrxsMods.site\n\n`;
        // Datos de ip-api.com
        if (api1) {
            info += `- - - - - - - - - - - - - - -\n`;
            info += `🔹 *IP:* ${api1.query}\n`;
            info += `🔹 *País:* ${api1.country} (${api1.countryCode})\n`;
            info += `🔹 *Región:* ${api1.regionName}\n`;
            info += `🔹 *Ciudad:* ${api1.city}\n`;
            info += `🔹 *Código Postal:* ${api1.zip}\n`;
            info += `🔹 *Latitud:* ${api1.lat}\n`;
            info += `🔹 *Longitud:* ${api1.lon}\n`;
            info += `🔹 *ISP:* ${api1.isp}\n`;
            info += `🔹 *Org:* ${api1.org}\n`;
            info += `🔹 *Host:* ${api1.reverse || 'N/A'}\n`;
            info += `🔹 *Zona Horaria:* ${api1.timezone}\n`;
        }

        // Datos de ipwhois.app
        if (api2) {
            info += `- - - - - - - - - - - - - - -\n`;
            info += `🔹 *ASN:* ${api2.asn}\n`;
            info += `🔹 *Dominio:* ${api2.domain || 'N/A'}\n`;
            info += `🔹 *Continente:* ${api2.continent}\n`;
            info += `🔹 *Bloque de IP:* ${api2.ip_range}\n`;
            info += `🔹 *Capital del País:* ${api2.country_capital}\n`;
            info += `🔹 *Países Fronterizos:* ${api2.country_neighbours}\n`;
            info += `🔹 *Teléfono Internacional:* ${api2.country_phone}\n`;
            info += `🔹 *Hora Actual:* ${api2.timezone_current_time}\n`;
        }

        // Datos de ipinfo.io
        if (api3) {
            info += `- - - - - - - - - - - - - - -\n`;
            info += `🔹 *Hostname:* ${api3.hostname || 'N/A'}\n`;
            info += `🔹 *Organización:* ${api3.org || 'N/A'}\n`;
            info += `🔹 *Localización:* ${api3.city}, ${api3.region}\n`;
            info += `🔹 *Coordenadas:* ${api3.loc}\n`;
            info += `🔹 *Código Postal:* ${api3.postal}\n`;
        }

        // Datos de freegeoip
        if (api4) {
            info += `- - - - - - - - - - - - - - -\n`;
            info += `🔹 *Continente Código:* ${api4.continent_code}\n`;
            info += `🔹 *Región Código:* ${api4.region_code}\n`;
            info += `🔹 *Metro Code:* ${api4.metro_code}\n`;
        }

        // Datos de AbuseIPDB
        if (api5 && api5.data) {
            info += `- - - - - - - - - - - - - - -\n`;
            info += `🔹 *Reportes de Abuso:* ${api5.data.abuseConfidenceScore}%\n`;
            info += `🔹 *Uso de la IP:* ${api5.data.usageType}\n`;
            info += `🔹 *Fecha del Último Reporte:* ${api5.data.lastReportedAt || 'N/A'}\n`;
            info += `🔹 *País ISP:* ${api5.data.countryCode}\n`;
        }

        // Enviar la información al usuario
        await conn.reply(m.chat, info, m);
        if (flag) await conn.sendFile(m.chat, flag, 'flag.png', '', m, null);
        await m.react('✅');

    } catch (error) {
        await conn.reply(m.chat, `💎 Hubo un error al intentar obtener la información: ${error.message}`, m);
        await m.react('✖️');
    }
}

handler.help = ['chkip *<ip>*']
handler.tags = ['premium']
handler.command = ['chkip']
handler.premium = true
export default handler;