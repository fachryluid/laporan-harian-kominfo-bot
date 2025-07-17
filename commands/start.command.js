const db = require('../models');
const { getLatestGitTag } = require('../utils/helpers');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;
    const userProfile = await db.UserProfile.findByPk(userId);

    const chatId = msg.chat.id;
    const username = userProfile?.nama || msg.from.first_name || 'Pengguna';

    const version = getLatestGitTag();

    const welcomeMessage = `
👋 Hai, ${username}!
Selamat datang di *Bot Laporan Harian Diskominfo-SP Kab. Buol*.

📝 *Cara mengisi laporan:*
- Kirim *teks biasa* → akan disimpan sebagai laporan harian.
- Kirim *foto dengan caption* → akan disimpan beserta gambar.

📋 *Perintah yang tersedia:*
/commands - Lihat daftar perintah yang tersedia.

🚀 Silakan mulai dengan mengirim laporan harianmu sekarang juga.

Bot ini dikembangkan oleh *Bidang E-Government - Diskominfo-SP Kab. Buol*. ${version} © 2025. All rights reserved.
    `;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  });
};