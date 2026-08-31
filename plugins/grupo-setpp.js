import { Jimp, JimpMime } from "jimp";
import { S_WHATSAPP_NET } from "@whiskeysockets/baileys";

let handler = async (m, { conn }) => {
  try {
    let groupId = m.chat;
    let quotedMsg = m.quoted ? m.quoted : m;
    if (!m.quoted) return m.reply(`*⚠️ Responde a una Imagen.*`);
    let media = await quotedMsg.download();

    async function processImage(media) {
      const image = await Jimp.read(media);
      if (image.width > image.height) image.resize({ w: 720 });
      else image.resize({ h: 720 });
      return {
        img: await image.getBuffer(JimpMime.jpeg),
      };
    }

    var { img: processedImage } = await processImage(media);

    conn.query({
      tag: "iq",
      attrs: { target: groupId, to: S_WHATSAPP_NET, type: "set", xmlns: "w:profile:picture" },
      content: [{ tag: "picture", attrs: { type: "image" }, content: processedImage }],
    });

    m.react("✅️");
  } catch (error) {
    console.log(error);
    return m.react("❌");
  }
};

handler.help = ["setppgc"];
handler.tags = ["group"];
handler.command = /^setpp(group|grup|gc)?$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
