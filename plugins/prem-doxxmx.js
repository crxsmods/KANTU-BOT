import fetch from 'node-fetch'

let data = [

    {

        NB_PRIAPE: 'MELENDEZ',

        NB_SEGAPE: 'CASTILLO',

        NB_CTE: 'CLAUDIA VERONICA',

        RFC: 'MECC7309103AA',

        FH_NACIMIENTO: '10/09/1973',

        DOMICILIO: 'VALLE DE MEXICALI 5605',

        COLONIA: 'LOMAS DEL VALLE I Y II',

        MUNICIPIO: 'CHIHUAHUA',

        REGION: 'CH',

        CP: '31216',

        TEL_1: '6144221764',

        TEL_2: '6144112814',

        LIMITE_CREDITO: 35000

    },

    {

        NB_PRIAPE: 'GONZALEZ',

        NB_SEGAPE: 'MONTELONGO',

        NB_CTE: 'CYNTHIA EDELMIRA',

        RFC: 'GOMC861022999',

        FH_NACIMIENTO: '22/10/1986',

        DOMICILIO: 'SIERRA SAN CARLOS 428',

        COLONIA: 'FRACC FUENTES SECC LOMAS',

        MUNICIPIO: 'REYNOSA',

        REGION: 'TM',

        CP: '88743',

        TEL_1: '8999231107',

        TEL_2: '8999242207',

        LIMITE_CREDITO: 9900

    }

]

let handler = async (m, { conn, args, usedPrefix, command }) => {

    if (!args[0]) {

        return conn.reply(m.chat, `🚩 Ingrese un número de búsqueda válido:\n\n1. Buscar por Nombre o Apellidos\nEjemplo: *${usedPrefix + command} 1 [Nombre - Apellido]*\n\n2. Buscar por Teléfono\nEjemplo: *${usedPrefix + command} 2 [Teléfono]*\n\n3. Buscar por Fecha de Nacimiento\nEjemplo: *${usedPrefix + command} 3 [Dia/Mes/Año]*\n\n4. Buscar por RFC\nEjemplo: *${usedPrefix + command} 4 [RFC]*`, m, rcanal)

    }

    let opcion = args[0] // Primer argumento define la opción

    let query = args.slice(1).join(' ') // El resto es la búsqueda

    let resultados = []

    switch (opcion) {

        case '1': // Búsqueda por nombre o apellidos

            if (!query) return conn.reply(m.chat, '🚩 Ingrese el nombre o los apellidos que desea buscar.\nEjemplo: *' + usedPrefix + command + ' 1 Claudia*', m, rcanal)

            resultados = data.filter(item =>

                `${item.NB_PRIAPE} ${item.NB_SEGAPE} ${item.NB_CTE}`.toLowerCase().includes(query.toLowerCase())

            )

            break

        case '2': // Búsqueda por teléfono

            if (!query) return conn.reply(m.chat, '🚩 Ingrese un número de teléfono que desea buscar.\nEjemplo: *' + usedPrefix + command + ' 2 7121649714*', m, rcanal)

            resultados = data.filter(item =>

                item.TEL_1.includes(query) || item.TEL_2.includes(query)

            )

            break

        case '3': // Búsqueda por fecha de nacimiento

            if (!query) return conn.reply(m.chat, '🚩 Ingrese la fecha de nacimiento que desea buscar (dd/mm/yyyy).\nEjemplo: *' + usedPrefix + command + ' 3 10/09/1973*', m, rcanal)

            resultados = data.filter(item =>

                item.FH_NACIMIENTO.includes(query)

            )

            break

        case '4': // Búsqueda por RFC

            if (!query) return conn.reply(m.chat, '🚩 Ingrese el RFC que desea buscar.\nEjemplo: *' + usedPrefix + command + ' 4 MECC73...*', m, rcanal)

            resultados = data.filter(item =>

                item.RFC.toLowerCase().includes(query.toLowerCase())

            )

            break

        default:

            return conn.reply(m.chat, '🚩 Opción inválida. Ingrese un número de búsqueda válido: 1 (Nombre), 2 (Teléfono), 3 (Fecha de nacimiento), 4 (RFC).', m, rcanal)

    }

    if (resultados.length === 0) {

        return conn.reply(m.chat, '🚩 No se encontraron resultados para su búsqueda.', m, rcanal)

    }

    let respuesta = '🗂 *Resultados encontrados:*\n\n'

    resultados.forEach((item, index) => {

        respuesta += `*Resultado ${index + 1}:*\n`

        respuesta += `• *Datos personales*\n`

        respuesta += `👤 *Nombre Completo*: ${item.NB_CTE} ${item.NB_PRIAPE} ${item.NB_SEGAPE}\n`

        respuesta += `📅 *Fecha de Nacimiento*: ${item.FH_NACIMIENTO}\n`

        respuesta += `🆔 *RFC*: ${item.RFC}\n\n`

        

        respuesta += `• *Ubicación*\n`

        respuesta += `🏠 *Domicilio*: ${item.DOMICILIO}, ${item.COLONIA}\n`

        respuesta += `🏙️ *Municipio*: ${item.MUNICIPIO}, ${item.REGION}\n`

        respuesta += `📮 *Código Postal*: ${item.CP}\n\n`

        

        respuesta += `• *Crédito*\n`

        respuesta += `💳 *Límite de Crédito*: $${item.LIMITE_CREDITO}\n\n`

        respuesta += `• *Contacto*\n`

        respuesta += `📞 *Teléfono 1*: ${item.TEL_1}\n`

        respuesta += `📞 *Teléfono 2*: ${item.TEL_2}\n`

        respuesta += `- - - - - - - - - - - - - - -\n`

    })

    conn.reply(m.chat, respuesta, m, rcanal)

}

handler.help = ['doxxmx <opción> <valor>']

handler.tags = ['premium']

handler.command = ['doxxmx']

handler.premium = true

export default handler