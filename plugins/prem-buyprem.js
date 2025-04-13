let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (args.length === 0) {
        // Si el usuario solo usa el comando sin argumento
        return conn.reply(m.chat, `🚨 *SER PREMIUM* 🚨

*Ser premium ofrece muchas ventajas, entre las más destacadas están:*

\`\`\`D O X X\`\`\`
_Doxeo a Diferentes Países, incluyendo:_
- México 
- Perú
- Argentina 
- Venezuela 
- IP exacta 
- Doxx por Correo 
- Por número 
*Y mucho más...*

\`\`\`A T A Q U E S\`\`\`
_Ataques a tus enemigos_
- Ataque DDoS
- Vulnerar 
- Enviar Spam a correos
- Ataques a números de WhatsApp
- Crash
*Y mucho más...*

🚨 **Especifica la duración de tu suscripción**. Ejemplos de uso:
- \`.buyprem 1 semana\`
- \`.buyprem 1 mes\`

Para días personalizados, solo escribe los días: 
- \`.buyprem 10 días\`

¡Aprovecha las ventajas y conviértete en Premium ahora!`, m);
    }

    let duration = args[0].toLowerCase();
    let price = 0;
    let timeUnit = "";
    let additionalMessage = "";

    // Detectar duración y calcular el precio
    if (duration === "semana" || duration === "1 semana") {
        price = 3;
        timeUnit = "semana";
    } else if (duration === "mes" || duration === "1 mes") {
        price = 6;
        timeUnit = "mes";
    } else if (duration.includes("día") || duration.includes("días")) {
        let days = parseInt(duration);
        if (isNaN(days)) {
            return conn.reply(m.chat, "🇦🇷 *Por favor, ingresa una duración válida en días.*", m);
        }

        // Calcular precio personalizado basado en días
        let weeks = Math.floor(days / 7); // Cuántas semanas tiene
        let extraDays = days % 7; // Días adicionales

        price = weeks * 3; // Precio por semanas
        if (extraDays > 0) {
            price += 3; // Si hay días adicionales, se cobra como una semana más
        }

        // Aplicar un 8% extra para días personalizados
        price = Math.round(price * 1.08); // Redondear el precio
        additionalMessage = `💎 *Comprar ${days} días* 💎\n
\`\`\`CANTIDAD:\`\`\`「 *${price} USD* 」
*Entre más días, más barato*`;
    }

    // Mensaje con los datos de pago
    let paymentInfo = `
**Datos de pago**

> **Transferencia Bancaria**  
Banco: STP  
CLAVE: 646420146408251980  
Nombre: KantuBot

> **Paypal**  
Correo ✉️: crxsofcfdh2@gmail.com

> **NOTA**: Después de realizar tu pago, escribe el comando \`.pagoprem\` para confirmar tu suscripción premium.
`;

    // Responder con el mensaje correspondiente según la duración
    if (price > 0) {
        return conn.reply(m.chat, `${additionalMessage || `💎 *Comprar ${duration}* 💎
\`\`\`CANTIDAD:\`\`\`「 *${price} USD* 」
*Entre más días, más barato*`}

${paymentInfo}`, m);
    } else {
        return conn.reply(m.chat, "🚨 *Error*, no pude detectar la duración correctamente. Por favor, escribe una duración válida como 'semana', 'mes' o 'días'.", m);
    }
};

// Comando para confirmar pago
let handlerPayment = async (m, { conn }) => {
    return conn.reply(m.chat, `💎 *Pago en proceso* 💎

*En un momento nos contactamos contigo para confirmar tu suscripción.*
*Si no recibes respuesta en las próximas 2 horas, contáctanos al +5217121649714.*

> **NOTA**: No realices capturas falsas, evita ser bloqueado.`, m);
};

handlerPayment.command = ['pagoprem'];
handlerPayment.help = ['pagoprem'];
handlerPayment.tags = ['info'];

handler.help = ['buyprem', 'serprem'];
handler.tags = ['info'];
handler.command = ['buyprem', 'serprem', 'premium', 'vip', 'prem'];
handler.premium = false;

export { handler, handlerPayment };