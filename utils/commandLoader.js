const fs = require('fs');
const path = require('path');

let commandNames = null;

/**
 * Membaca direktori commands dan mengembalikan nama-nama command.
 * Hasilnya di-cache untuk pemanggilan berikutnya agar tidak membaca file sistem berulang kali.
 * @returns {string[]} Daftar nama command (misal: ['start', 'unduh']).
 */
function getCommandNames() {
  if (commandNames === null) {
    const commandsPath = path.join(__dirname, '../commands');
    try {
      commandNames = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.command.js'))
        .map(file => file.replace('.command.js', ''));
    } catch (error) {
      console.error('❌ Gagal membaca direktori commands:', error);
      commandNames = []; // Kembalikan array kosong jika terjadi error
    }
  }
  return commandNames;
}

/**
 * Mendaftarkan semua file command ke instance bot.
 * @param {import('node-telegram-bot-api')} bot Instance bot Telegram.
 */
function registerCommands(bot) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = getCommandNames().map(name => `${name}.command.js`);

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (typeof command === 'function') {
        command(bot); // inject bot
      }
    } catch (error) {
      console.error(`❌ Gagal memuat command dari file ${file}:`, error);
    }
  }
}

module.exports = {
  getCommandNames,
  registerCommands,
};