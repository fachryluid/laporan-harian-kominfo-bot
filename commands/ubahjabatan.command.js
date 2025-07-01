const db = require('../models');

module.exports = (bot) => {
  bot.onText(/\/ubahjabatan(?:\s+(.+))?/, async (msg, match) => {
    const userId = msg.from.id;
    const jabatan = match[1]?.trim();

    if (!jabatan) {
      return bot.sendMessage(msg.chat.id, '⚠️ Format salah. Gunakan: `/ubahjabatan <nama jabatan>`\n\nContoh: `/ubahjabatan Pranata Komputer Ahli Pertama`', {
        parse_mode: 'Markdown'
      });
    }

    await db.UserProfile.upsert({ user_id: userId, jabatan });

    bot.sendMessage(msg.chat.id, `✅ Jabatan berhasil diperbarui menjadi *${jabatan}*`, {
      parse_mode: 'Markdown'
    });
  });
};
