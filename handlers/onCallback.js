const fs = require('fs');
const path = require('path');
const db = require('../models');
const { perbaikiDeskripsi } = require('../utils/perbaikiDeskripsi');
const { getReplyMarkup, generateCaption } = require('../utils/helpers');
const { cleanDeskripsiAI } = require('../utils/helpers');

module.exports = function (bot, pendingLaporan) {
  return async function (query) {
    const userId = query.from.id;
    const data = query.data;
    const laporan = pendingLaporan.get(userId);
    if (!laporan) return bot.answerCallbackQuery(query.id, { text: 'Tidak ada laporan tertunda.' });

    const { deskripsi, raw, fileName, username, chatId, messageId } = laporan;

    if (data === 'simpan') {
      try {
        await db.Laporan.create({
          user_id: userId,
          username,
          deskripsi: raw,
          deskripsi_ai: deskripsi,
          foto: fileName || null
        });
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await bot.sendMessage(chatId, '✅ Deskripsi berhasil disimpan!');
        pendingLaporan.delete(userId);
      } catch (err) {
        console.error('❌ DB Error:', err);
        await bot.sendMessage(chatId, '❌ Gagal menyimpan laporan.');
      }
    } else if (data === 'simpan_asli') {
      await db.Laporan.create({
        user_id: userId,
        username,
        deskripsi: raw,
        deskripsi_ai: null,
        foto: fileName || null
      });
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
      await bot.sendMessage(chatId, '✅ Deskripsi asli berhasil disimpan!');
      pendingLaporan.delete(userId);
    } else if (data === 'ulang') {
      try {
        // Cek kelengkapan profil sebelum memproses laporan
        const userProfile = await db.UserProfile.findByPk(userId);
        const jabatan = userProfile?.jabatan;
        const unitKerja = userProfile?.unit_kerja;

        laporan.retryCount = (laporan.retryCount || 0) + 1;

        const { text: newDeskripsi, duration: newDuration } = await perbaikiDeskripsi(raw, unitKerja, jabatan);

        laporan.deskripsi = cleanDeskripsiAI(newDeskripsi);
        laporan.duration = newDuration;
        pendingLaporan.set(userId, laporan);

        const caption = generateCaption(laporan);
        await bot.editMessageText(caption, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getReplyMarkup()
        });
      } catch (err) {
        console.error('❌ Gagal ulang:', err);
        await bot.sendMessage(chatId, '❌ Gagal memperbaiki ulang.');
      }
    } else if (data === 'batal') {
      if (fileName) {
        const filePath = path.join(__dirname, '../uploads', fileName);
        fs.unlink(filePath, () => { });
      }
      pendingLaporan.delete(userId);
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
      await bot.sendMessage(chatId, '🚫 Laporan dibatalkan.');
    }
    bot.answerCallbackQuery(query.id).catch(() => { });
  }
};
