# KANTU-BOT 🚀

<p align="center">
  <img src="https://i.ibb.co/SwK9jhQ4/KANTUBOT.png" alt="KANTU-BOT" width="800"/>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/crxsmods/KANTU-BOT/main/demo.gif" alt="KANTU-BOT Demo" width="800"/>
</p>

<p align="center">
  <a href="https://github.com/crxsmods/KANTU-BOT/stargazers"><img src="https://img.shields.io/github/stars/crxsmods/KANTU-BOT?style=for-the-badge&logo=github" alt="Stars"/></a>
  <a href="https://github.com/crxsmods/KANTU-BOT/network/members"><img src="https://img.shields.io/github/forks/crxsmods/KANTU-BOT?style=for-the-badge&logo=github" alt="Forks"/></a>
  <a href="https://github.com/crxsmods/KANTU-BOT/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/crxsmods/KANTU-BOT/ci.yml?style=for-the-badge&logo=github" alt="Build Status"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/crxsmods/KANTU-BOT?style=for-the-badge" alt="License"/></a>
</p>

---

## 🎉 Demo y GIFs <a name="demo"></a>

¡Mira KANTU-BOT en acción! Interactúa en tiempo real con comandos multimedia, stickers, economía RPG y más.

<a href="http://wa.me/5217121649714" target="blank"><img src="https://img.shields.io/badge/Creador-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
<a href="http://wa.me/5216612869463?text=.estado" target="blank"><img src="https://img.shields.io/badge/Bot%20oficial-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>

<p align="center">
  <img src="https://raw.githubusercontent.com/crxsmods/KANTU-BOT/main/screenshots/menu.gif" alt="Menú Interactivo" width="600"/>
  <img src="https://raw.githubusercontent.com/crxsmods/KANTU-BOT/main/screenshots/command_demo.gif" alt="Demo de Comandos" width="600"/>
</p>

---

## 🧩 Características <a name="features"></a>

- **📺 Multimedia**: `.play`, `.ytmp4`, `.sticker` animados, descargas de TikTok, Instagram, Facebook y Pinterest.
- **🎮 Economía RPG**: niveles, monedas, trabajo, robos, tienda, parejas y ranking.
- **👥 Grupos**: bienvenidas, antilink, antifake, advertencias, staff y configuración por grupo.
- **🤖 IA**: `.chatgpt` con memoria por grupo.
- **🔌 Plugins**: sistema modular; agrega comandos con solo poner un archivo `.js` en `plugins/`.
- **🗄️ Base local**: funciona al descargarlo, sin configurar ninguna base de datos.
- **📦 Multiplataforma**: Termux, Docker, Pterodactyl, Replit.

---

## ⚙️ Instalación <a name="installation"></a>

<div align="center">
  <a href="#termux"><img src="https://img.shields.io/badge/Termux-Android-informational?style=flat&logo=termux" alt="Termux"/></a>
  <a href="#docker"><img src="https://img.shields.io/badge/Docker-Container-blue?style=flat&logo=docker" alt="Docker"/></a>
  <a href="#replit"><img src="https://img.shields.io/badge/Replit-Cloud-orange?style=flat&logo=replit" alt="Replit"/></a>
</div>

### 📱 Termux
[![blog](https://img.shields.io/badge/Instalacion-Automatica-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://hackstorex.com)
> ⬇️ 𝐄𝐒𝐂𝐑𝐈𝐁𝐄 𝐋𝐎𝐒 𝐒𝐈𝐆𝐔𝐈𝐄𝐍𝐓𝐄𝐒 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒 𝐔𝐍𝐎 𝐏𝐎𝐑 𝐔𝐍𝐎 (Opción 1)
```bash
termux-setup-storage
```
```bash
apt update -y && yes | apt upgrade && pkg install -y bash wget mpv && wget -O - https://raw.githubusercontent.com/crxsmods/KANTU-BOT/main/install.sh | bash
```
-----
### 📁 (OPCIÓN 2) 𝐀𝐂𝐓𝐈𝐕𝐀 𝐄𝐋 𝐓𝐄𝐑𝐌𝐔𝐗
> **Note** Descarga y descomprime
### [`KantuBot ~ Archivos`](https://github.com/crxsmods/KANTU-BOT/archive/refs/heads/main.zip)
```bash
termux-setup-storage
```
```bash
apt update && apt upgrade && pkg install -y git nodejs ffmpeg imagemagick yarn
```
```bash
cd storage/downloads/KANTU-BOT-main/KANTU-BOT-main
```
```bash
npm install
```
```bash
npm start
```
-----
### `𝐀𝐂𝐓𝐈𝐕𝐀𝐑 𝐄𝐍 𝐂𝐀𝐒𝐎 𝐃𝐄 𝐃𝐄𝐓𝐄𝐍𝐄𝐑𝐒𝐄`
```bash
𝐄𝐒𝐂𝐑𝐈𝐁𝐄 𝐋𝐎𝐒 𝐒𝐈𝐆𝐔𝐈𝐄𝐍𝐓𝐄𝐒 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒 𝐔𝐍𝐎 𝐏𝐎𝐑 𝐔𝐍𝐎:
> cd
> cd KANTU-BOT
> npm start
```
### `𝐎𝐁𝐓𝐄𝐍𝐄𝐑 𝐎𝐓𝐑𝐎 𝐂𝐎𝐃𝐈𝐆𝐎 𝐐𝐑`
```bash
𝐄𝐒𝐂𝐑𝐈𝐁𝐄 𝐋𝐎𝐒 𝐒𝐈𝐆𝐔𝐈𝐄𝐍𝐓𝐄𝐒 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒 𝐔𝐍𝐎 𝐏𝐎𝐑 𝐔𝐍𝐎:
> cd
> cd KANTU-BOT
> rm -rf BotSession
> npm start
```

-----
### ⚡ ACTIVA EL REPLIT
<a target="_blank" href="https://replit.com/github/crxsmods/KANTU-BOT"><img alt="Run on Replit" src="https://binbashbanana.github.io/deploy-buttons/buttons/remade/replit.svg"></a>

- [x] Resultado <details><summary>Importar Repositorio - KANTU-BOT</summary><img src="https://i.imgur.com/GQyRnMf.jpg"></details>

---

## 🚀 Uso y Comandos <a name="usage"></a>

| Comando                  | Descripción                                     |
| ------------------------ | ----------------------------------------------- |
| `.menu`                  | Muestra el menú con todas las opciones          |
| `.play <canción>`        | Reproduce audio desde YouTube                   |
| `.ytmp4 <url>`           | Descarga video en MP4                           |
| `.sticker [foto/video]`  | Convierte multimedia a sticker animado          |
| `.chatgpt <mensaje>`     | Habla con la IA de KantuBot                     |
| `.antilink`              | Protección de enlaces en el grupo               |
| `.warn @usuario`         | Advierte a un usuario                           |
| `.perfil`                | Muestra tu perfil RPG                           |
| `.stats`                 | Muestra métricas de uso                         |

Y muchos comandos más — escribe `.menu` para verlos todos.

---

## 🗄️ Base de datos <a name="database"></a>

No hace falta configurar nada. Sin `DATABASE_URL` el bot crea una base
PostgreSQL local en `./database` al primer arranque: descargas, ejecutas y
funciona. Los datos son de esa instalación y no salen de la máquina.

Si prefieres una base propia (Supabase, Neon, PostgreSQL local), define
`DATABASE_URL` en tu `.env` y tendrá prioridad sobre la local.

---

## 📈 Roadmap <a name="roadmap"></a>

- [x] Multimedia y descargas
- [x] Economía RPG
- [x] Base de datos local integrada
- [ ] Panel web de administración
- [ ] Analítica de uso

---

## ❓ FAQ <a name="faq"></a>

**¿Es gratis?**
Sí, `es completamente gratis`.

**¿Puedo cambiar el prefijo?**
Sí, con el comando `.setprefix` o desde la configuración del grupo.

**¿Puedo editar el bot?**
Sí, `puedes editarlo dejando los créditos`.

---

## 🤝 Contribuir <a name="contribute"></a>

¡Contribuciones bienvenidas! Sigue estos pasos:

1. Haz fork de este repositorio.
2. Crea una rama (`git checkout -b feature/nueva-funcion`).
3. Haz tus cambios y commitea (`git commit -m "Agrega nueva función"`).
4. Sube tu rama (`git push origin feature/nueva-funcion`).
5. Abre un Pull Request.

---

## 📜 Licencia <a name="license"></a>

Este proyecto está licenciado bajo [MIT](LICENSE). ©CrxsMods

---

## 🙏 Créditos y Agradecimientos <a name="credits"></a>
### 🌟 EDITOR Y PROPIETARIO DEL BOT
<a href="https://github.com/crxsmods"><img src="https://github.com/crxsmods.png" width="300" height="300" alt="crxsmods"/></a>

**Desarrollado por:** [CrxsMods](https://github.com/crxsmods) 💻

### 🌟 COLABORADORES
[![SANTIAGO](https://github.com/santiagobak.png?size=150)](https://github.com/santiagobak)

### 🌟 AGRADECIMIENTOS
[![BASE DE BOT](https://github.com/BrunoSobrino.png?size=40)](https://github.com/BrunoSobrino)

**Agradecimiento especial:** a todos los usuarios y testers que han apoyado este proyecto desde sus primeras versiones. ¡Gracias por hacerlo crecer! 🚀
