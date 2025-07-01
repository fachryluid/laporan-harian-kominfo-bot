const db = require('../models');

module.exports = (bot) => {
  bot.onText(/\/ubahnama(?:\s+(.+))?/, async (msg, match) => {
    const userId = msg.from.id;
    const nama = match[1]?.trim();

    if (!nama) {
      return bot.sendMessage(msg.chat.id, '⚠️ Format salah. Gunakan: `/ubahnama <nama lengkap>`\n\nContoh: `/ubahnama John Doe`', {
        parse_mode: 'Markdown'
      });
    }

    await db.UserProfile.upsert({ user_id: userId, nama });

    bot.sendMessage(msg.chat.id, `✅ Nama berhasil diperbarui menjadi *${nama}*`, {
      parse_mode: 'Markdown'
    });
  });
};