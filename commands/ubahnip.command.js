const db = require('../models');

module.exports = (bot) => {
  bot.onText(/\/ubahnip(?:\s+(.+))?/, async (msg, match) => {
    const userId = msg.from.id;
    const nip = match[1]?.trim();

    if (!nip) {
      return bot.sendMessage(msg.chat.id, '⚠️ Format salah. Gunakan: `/ubahnip <nomor NIP>`\n\nContoh: `/ubahnip 198909092020121001`', {
        parse_mode: 'Markdown'
      });
    }

    await db.UserProfile.upsert({ user_id: userId, nip });

    bot.sendMessage(msg.chat.id, `✅ NIP berhasil diperbarui menjadi *${nip}*`, {
      parse_mode: 'Markdown'
    });
  });
};