import fetch from 'node-fetch';

import dns from 'dns';

let handler = async (m, { conn, args, usedPrefix, command }) => {

    if (!args[0]) return conn.reply(m.chat, `*💎 Ingrese un dominio válido para obtener la IP.*\n*⚡ Ejemplo de uso:* ${usedPrefix + command} google.com`, m);

    let domain = args[0];

    // Resuelve el dominio a una IP utilizando DNS

    dns.lookup(domain, async (err, address) => {

        if (err) {

            return conn.reply(m.chat, `🚩 Error al resolver el dominio: ${err.message}`, m);

        }

        // Una vez resuelto el dominio, procedemos a usar las APIs para obtener información adicional sobre la IP

        await m.react('🕓', rcanal);  // Reacción para indicar que está procesando

        try {

            let api1, api2, api3, api4;

            try {

                api1 = await fetch(`http://ip-api.com/json/${address}`);

                api1 = await api1.json();

            } catch (e) {

                console.log(`Error con ip-api: ${e.message}`);

            }

            try {

                api2 = await fetch(`https://ipwhois.app/json/${address}`);

                api2 = await api2.json();

            } catch (e) {

                console.log(`Error con ipwhois: ${e.message}`);

            }

            try {

                api3 = await fetch(`https://ipinfo.io/${address}/json`);

                api3 = await api3.json();

            } catch (e) {

                console.log(`Error con ipinfo: ${e.message}`);

            }

            try {

                api4 = await fetch(`https://freegeoip.app/json/${address}`);

                api4 = await api4.json();

            } catch (e) {

                console.log(`Error con freegeoip: ${e.message}`);

            }

            // Validar si alguna API respondió correctamente

            if (!api1 && !api2 && !api3 && !api4) {

                return conn.reply(m.chat, '💎 No se pudo obtener la información de la IP en ninguna fuente.', m);

            }

            let flag = api1 ? `https://countryflagsapi.com/png/${api1.countryCode.toLowerCase()}` : '';

            let info = `乂  *IP Checker (Web)* 么\n`;
            info += `Script By https://CrxsMods.site\n\n`;
            info += `🔹 *Dominio:* ${domain}\n`;

            info += `🔹 *IP Resuelta:* ${address}\n`;

            // Datos de ip-api.com

            if (api1) {

                info += `- - - - - - - - - - - - - - -\n`;

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

                info += `🔹 *Dominio de ISP:* ${api2.domain || 'N/A'}\n`;

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

            // Enviar la información al usuario

            await conn.reply(m.chat, info, m);

            if (flag) await conn.sendFile(m.chat, flag, 'flag.png', '', m, null);

            await m.react('✅', rcanal);

        } catch (error) {

            await conn.reply(m.chat, `🚩 Hubo un error al intentar obtener la información: ${error.message}`, m);

            await m.react('✖️', rcanal);

        }

    });

}

handler.help = ['ipweb *<domain>*']

handler.tags = ['premium', "buscadores"]

handler.command = ['ipweb']

export default handler;
handler.premium = false