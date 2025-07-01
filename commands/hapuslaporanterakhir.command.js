const db = require('../models');
const moment = require('moment');
require('moment/locale/id');
moment.locale('id');

module.exports = (bot) => {
  bot.onText(/\/hapuslaporanterakhir/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Cari laporan terakhir
    const latestReport = await db.Laporan.findOne({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    if (!latestReport) {
      return bot.sendMessage(chatId, '📭 Anda belum memiliki laporan yang bisa dihapus.');
    }

    const waktu = moment(latestReport.createdAt).format('dddd, DD MMMM YYYY HH:mm');
    const deskripsi = latestReport.deskripsi.length > 100
      ? latestReport.deskripsi.slice(0, 100) + '...'
      : latestReport.deskripsi;

    // Simpan ID laporan untuk dikaitkan saat callback
    const callbackData = `hapus:${latestReport.id}`;

    const message = `⚠️ Apakah Anda yakin ingin menghapus laporan terakhir berikut?\n\n🗓️ *Waktu:* _${waktu}_\n📝 *Deskripsi:* _${deskripsi}_`;

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Ya, hapus', callback_data: callbackData },
            { text: '❌ Batal', callback_data: 'batalhapus' }
          ]
        ]
      }
    });
  });

  // Handle tombol inline keyboard
  bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;

    if (data.startsWith('hapus:')) {
      const laporanId = data.split(':')[1];

      // Cari dan pastikan laporan milik user
      const laporan = await db.Laporan.findOne({
        where: { id: laporanId, user_id: userId }
      });

      if (!laporan) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Laporan tidak ditemukan atau sudah dihapus.', show_alert: true });
      }

      await laporan.destroy();

      const waktu = moment(laporan.createdAt).format('dddd, DD MMMM YYYY HH:mm');
      const deskripsi = laporan.deskripsi.length > 100
        ? laporan.deskripsi.slice(0, 100) + '...'
        : laporan.deskripsi;

      await bot.editMessageText(
        `🗑️ Laporan terakhir berhasil dihapus.\n\n🗓️ *Waktu:* _${waktu}_\n📝 *Deskripsi:* _${deskripsi}_`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown'
        }
      );

      bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data === 'batalhapus') {
      bot.editMessageText('❎ Penghapusan laporan dibatalkan.', {
        chat_id: chatId,
        message_id: msg.message_id
      });

      bot.answerCallbackQuery(callbackQuery.id);
    }
  });
};