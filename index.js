// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
// 🚨 DO NOT EDIT  - NO EDITAR 🚨
import cfonts from 'cfonts';
import chalk from 'chalk';

const getWidth = () => Math.min(process.stdout.columns || 50, 70) - 4;
const isMobile = () => (process.stdout.columns || 50) < 60;

const theme = {
  gradient: ['#ff006e', '#8338ec', '#3a86ff'],
  primary: '#8338ec',
  secondary: '#ff006e', 
  accent: '#3a86ff',
  gold: '#ffd700',
  muted: '#6c757d'
};

const createGradientLine = (width, colors = ['#ff006e', '#8338ec', '#3a86ff']) => {
  let line = '';
  for (let i = 0; i < width; i++) {
    const ratio = i / width;
    const colorIndex = Math.floor(ratio * (colors.length - 1));
    line += chalk.hex(colors[colorIndex])('━');
  }
  return line;
};

const printCentered = (text, width) => {
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, Math.floor((width - cleanText.length) / 2));
  console.log(' '.repeat(padding) + text);
};

console.clear();
console.log('');
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
const w = getWidth();
const mobile = isMobile();

console.log(chalk.hex('#ff006e')('  ┏') + createGradientLine(w) + chalk.hex('#3a86ff')('┓'));
console.log(chalk.hex('#ff006e')('  ┃') + ' '.repeat(w) + chalk.hex('#3a86ff')('┃'));

if (mobile) {
  cfonts.say('KANTU', {
    font: 'simple',
    align: 'center',
    colors: ['#ff006e', '#8338ec'],
    background: 'transparent',
    space: false,
    gradient: ['#ff006e', '#8338ec'],
    independentGradient: true,
    transitionGradient: true,
  });
} else {
  cfonts.say('KANTU BOT', {
    font: 'block',
    align: 'center',
    colors: ['#ff006e', '#8338ec'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 0,
    space: false,
    gradient: ['#ff006e', '#8338ec', '#3a86ff'],
    independentGradient: true,
    transitionGradient: true,
  });

  cfonts.say('BOT', {
    font: 'block', 
    align: 'center',
    colors: ['#8338ec', '#3a86ff'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 0,
    space: false,
    gradient: ['#8338ec', '#3a86ff', '#00f5d4'],
    independentGradient: true,
    transitionGradient: true,
  });
}
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
console.log(chalk.hex('#ff006e')('  ┃') + ' '.repeat(w) + chalk.hex('#3a86ff')('┃'));
console.log(chalk.hex('#ff006e')('  ┣') + createGradientLine(w) + chalk.hex('#3a86ff')('┫'));
console.log(chalk.hex('#ff006e')('  ┃') + ' '.repeat(w) + chalk.hex('#3a86ff')('┃'));

if (mobile) {
  printCentered(chalk.hex('#ffd700').bold('✨ Bot WhatsApp - Power By HackStoreX ✨'), w + 4);
} else {
  printCentered(chalk.hex('#ffd700').bold('✨ Premium WhatsApp Bot Framework ✨'), w + 4);
}

console.log(chalk.hex('#ff006e')('  ┃') + ' '.repeat(w) + chalk.hex('#3a86ff')('┃'));
console.log(chalk.hex('#ff006e')('  ┃') + chalk.hex('#6c757d')(' ─'.repeat(Math.floor(w/2))) + chalk.hex('#3a86ff')('┃'));
console.log(chalk.hex('#ff006e')('  ┃') + ' '.repeat(w) + chalk.hex('#3a86ff')('┃'));

if (mobile) {
  printCentered(chalk.hex('#f8f9fa')(`by ${chalk.hex('#ff006e').bold('CrxsMods')}`), w + 4);
} else {
  printCentered(chalk.hex('#f8f9fa')(`◆ Desarrollado por ${chalk.hex('#ff006e').bold('CodeStoreX (Crxs)')} ◆`), w + 4);
}
// Creador CrxsMods
// Https://Github.com/CrxsMods 
// https://t.me/CrxsMods 
console.log(chalk.hex('#ff006e')('  ┃') + ' '.repeat(w) + chalk.hex('#3a86ff')('┃'));
console.log(chalk.hex('#ff006e')('  ┗') + createGradientLine(w) + chalk.hex('#3a86ff')('┛'));
console.log('');

import('./main.js');