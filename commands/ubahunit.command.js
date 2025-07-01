const db = require('../models');

module.exports = (bot) => {
  bot.onText(/\/ubahunit(?:\s+(.+))?/, async (msg, match) => {
    const userId = msg.from.id;
    const unitKerja = match[1]?.trim();

    if (!unitKerja) {
      return bot.sendMessage(msg.chat.id, '⚠️ Format salah. Gunakan: `/ubahunit <unit kerja>`\n\nContoh: `/ubahunit Bidang Aplikasi dan Informatika`', {
        parse_mode: 'Markdown'
      });
    }

    await db.UserProfile.upsert({ user_id: userId, unit_kerja: unitKerja });

    bot.sendMessage(msg.chat.id, `✅ Unit kerja berhasil diperbarui menjadi *${unitKerja}*`, {
      parse_mode: 'Markdown'
    });
  });
};