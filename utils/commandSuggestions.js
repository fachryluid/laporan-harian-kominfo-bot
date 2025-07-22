const { getCommandNames } = require('./commandLoader');

// Membaca file command untuk mendapatkan daftar dasar command
const commandFiles = getCommandNames();

// Menambahkan kata lain yang bisa memicu sugesti.
// Kunci adalah kata yang mungkin diketik pengguna, nilai adalah command sebenarnya.
const commandMap = {
  'hapus': 'hapuslaporanterakhir',
  'perintah': 'commands',
  'mulai': 'start',
  // Tambahkan alias atau salah ketik umum di sini jika perlu
};

// Memastikan semua command dari file ada di dalam map
commandFiles.forEach(cmd => {
  // Hanya tambahkan jika belum ada, agar alias manual tidak tertimpa
  if (!commandMap[cmd]) {
    commandMap[cmd] = cmd;
  }
});

/**
 * Memeriksa apakah teks yang diberikan adalah command potensial yang diketik tanpa garis miring.
 * @param {string} text Teks masukan dari pengguna.
 * @returns {string|null} Sugesti command dengan garis miring (misal, "/unduh"), atau null jika tidak ada sugesti.
 */
function getCommandSuggestion(text) {
  if (!text) return null;
  const command = text.toLowerCase().trim().split(' ')[0]; // Periksa kata pertama saja
  return commandMap[command] ? `/${commandMap[command]}` : null;
}

module.exports = { getCommandSuggestion };