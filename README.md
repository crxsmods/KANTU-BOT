# KANTU-BOT 🚀

<p align="center">
  <img src="https://i.ibb.co/SwK9jhQ4/KANTUBOT.png" alt="KANTU-BOT" width="800"/>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/crxsmods/KANTU-BOT/master/demo.gif" alt="KANTU-BOT Demo" width="800"/>
</p>

<p align="center">
  <a href="https://github.com/crxsmods/KANTU-BOT/stargazers"><img src="https://img.shields.io/github/stars/crxsmods/KANTU-BOT?style=for-the-badge&logo=github" alt="Stars"/></a>
  <a href="https://github.com/crxsmods/KANTU-BOT/network/members"><img src="https://img.shields.io/github/forks/crxsmods/KANTU-BOT?style=for-the-badge&logo=github" alt="Forks"/></a>
  <a href="https://github.com/crxsmods/KANTU-BOT/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/crxsmods/KANTU-BOT/ci.yml?style=for-the-badge&logo=github" alt="Build Status"/></a>
  <a href="https://coveralls.io/github/crxsmods/KANTU-BOT"><img src="https://img.shields.io/coveralls/github/crxsmods/KANTU-BOT?style=for-the-badge" alt="Coverage"/></a>
  <a href="https://www.npmjs.com/package/kantu-bot"><img src="https://img.shields.io/npm/v/kantu-bot?style=for-the-badge&logo=npm" alt="NPM Version"/></a>
  <a href="https://img.shields.io/npm/dw/kantu-bot?style=for-the-badge&logo=npm"><img src="https://img.shields.io/npm/dw/kantu-bot?style=for-the-badge&logo=npm" alt="Downloads Week"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/crxsmods/KANTU-BOT?style=for-the-badge" alt="License"/></a>
</p>

---

## 🎉 Demo y GIFs <a name="demo"></a>

¡Mira KANTU-BOT en acción! Interactúa en tiempo real con comandos multimedia, traducciones, recordatorios y más.

<a href="http://wa.me/5217121649714" target="blank"><img src="https://img.shields.io/badge/Creador-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /> 

<a href="http://wa.me/5215646254697?text=.estado" target="blank"><img src="https://img.shields.io/badge/Bot oficial-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
</a>

<p align="center">
  <img src="https://raw.githubusercontent.com/crxsmods/KANTU-BOT/master/screenshots/menu.gif" alt="Menú Interactivo" width="600"/>
  <img src="https://raw.githubusercontent.com/crxsmods/KANTU-BOT/master/screenshots/command_demo.gif" alt="Demo de Comandos" width="600"/>
</p>

---

## 🧩 Características <a name="features"></a>

- **📺 Multimedia**: `.play`, `.ytmp4`, `.ytmp3`, `.sticker` animados.
- **🌐 Idiomas**: `.translate`, `.define`, `.synonym`, `.summarize`.
- **⏰ Recordatorios**: `.remind`, `.schedule`, `.timer`.
- **📝 Notas y Listas**: Guarda notas, tareas y listas de compras.
- **🔌 Plugins**: Soporte para módulos externos y scripts JS.
- **📦 Múltiples Plataformas**: Termux, Docker, Heroku, Replit.
- **🔒 Seguridad**: Cifrado de mensajes, protección anti-spam.

---

## ⚙️ Instalación <a name="installation"></a>

<div align="center">
  <a href="#termux"><img src="https://img.shields.io/badge/Termux-Android-informational?style=flat&logo=termux" alt="Termux"/></a>
  <a href="#docker"><img src="https://img.shields.io/badge/Docker-Container-blue?style=flat&logo=docker" alt="Docker"/></a>
  <a href="#heroku"><img src="https://img.shields.io/badge/Heroku-Cloud-purple?style=flat&logo=heroku" alt="Heroku"/></a>
</div>

### 📱 Termux
[![blog](https://img.shields.io/badge/Instalacion-Automatica-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://hackstorex.com)
> ⬇️ 𝐄𝐒𝐂𝐑𝐈𝐁𝐄 𝐋𝐎𝐒 𝐒𝐈𝐆𝐔𝐈𝐄𝐍𝐓𝐄𝐒 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒 𝐔𝐍𝐎 𝐏𝐎𝐑 𝐔𝐍𝐎 (Opción 1) 
```bash
termux-setup-storage
```
```bash
apt update -y && yes | apt upgrade && pkg install -y bash wget mpv && wget -O - https://raw.githubusercontent.com/crxsmods/KANTU-BOT/master/install.sh | bash
```
-----
### 📁 (OPCIÓN 2) 𝐀𝐂𝐓𝐈𝐕𝐀 𝐄𝐋 𝐓𝐄𝐑𝐌𝐔𝐗
> **Note** Descargué y Descomprime
### [`KantuBot ~ Archivos`](https://github.com/crxsmods/KANTU-BOT/archive/refs/heads/master.zip)
```bash
termux-setup-storage
```
```bash
apt update && apt upgrade && pkg install -y git nodejs ffmpeg imagemagick yarn
```
```bash
cd storage/downloads/KANTU-BOT-master/KANTU-BOT-master 
```
```bash
npm install && yarn install 
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

## 🚀 Uso y Comandos <a name="usage"></a>

| Comando                      | Descripción                                     |
| ---------------------------- | ----------------------------------------------- |
| `.menu`                      | Muestra menú interactivo con todas las opciones |
| `.play <canción>`            | Reproduce audio desde YouTube                   |
| `.ytmp4 <url>`               | Descarga video en MP4                           |
| `.play2 <lang> <texto>`  | Descarga Videos de Youtube                |
| `.sticker [foto/video]`      | Convierte multimedia a sticker animado          |
| `.chatgpt <hora> <mensaje>`   | Habla con KantuBot                            |
| `.subasta <fecha> <evento>` | Programa una subasta                              |
| `.antilink`                | Gestion de Grupos                                 |
| `.stats`                     | Muestra métricas de uso                         |

Y muchos Comandos Mas
---

## 📈 Roadmap <a name="roadmap"></a>

- [x] Soporte básico multimedia
- [x] Panel web interactivo
- [x] Integración con bases de datos externas
- [ ] Notificaciones push móviles
- [x] Analítica avanzada con gráficos en tiempo real

---

## ❓ FAQ <a name="faq"></a>

**¿Es Gratis?**  
Si `Es Completamente Gratis`.

**¿Puedo cambiar el prefijo?**  
Sí, en `config` modifica `prefix`.

**¿Puedo Editar el Bot?**  
SI `puedes editar el bot dejando creditos`.

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

Este proyecto está licenciado bajo [FDH](LICENSE). ©CrxsMods

---

## 🙏 Créditos y Agradecimientos <a name="credits"></a>
### 🌟 EDITOR Y PROPIETARIO DEL BOT
<a href="https://github.com/crxsmods"><img src="https://github.com/crxsmods.png" width="300" height="300" alt="crxsmods"/></a>


**Desarrollado por:** [CrxsMods](https://github.com/crxsmods) 💻 

### 🌟 COLABORADORES
[![SANTIAGO](https://github.com/santiagobak.png?size=150)](https://github.com/santiagobak) 

### 🌟 AGRADECIMIENTOS
[![BASE DE BOT](https://github.com/BrunoSobrino.png?size=40)](https://github.com/BrunoSobrino) 
[![INSPIRADO POR](https://github.com/elrebelde21.png?size=40)](https://github.com/elrebelde21) 


**Agradecimiento especial:** a todos los usuarios y testers que han apoyado este proyecto desde sus primeras versiones. ¡Gracias por hacerlo crecer! 🚀
