const path = require('path');
const { perbaikiDeskripsi } = require('../utils/perbaikiDeskripsi');
const { downloadFile } = require('../utils/downloadFile');
const { getReplyMarkup, generateCaption } = require('../utils/helpers');
const { cleanDeskripsiAI } = require('../utils/helpers');
const { getCommandSuggestion } = require('../utils/commandSuggestions');
const db = require('../models');

module.exports = function (bot, pendingLaporan) {
  return async function (msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ''}`;

    if (msg.photo && !msg.caption) {
      await bot.sendMessage(chatId, '❌ Mohon sertakan *caption* saat mengirim foto. Caption akan digunakan sebagai deskripsi kegiatan.', {
        parse_mode: 'Markdown'
      });
      return;
    }

    const rawText = msg.caption || msg.text;

    if (!rawText || msg.text?.startsWith('/')) return;

    // Cek jika pengguna mungkin mencoba mengetik command tanpa '/'
    const suggestion = getCommandSuggestion(msg.text);
    if (suggestion) {
      return bot.sendMessage(chatId, `Mungkin maksud Anda *${suggestion}*?`, {
        parse_mode: 'Markdown'
      });
    }

    // Cek kelengkapan profil sebelum memproses laporan
    const userProfile = await db.UserProfile.findByPk(userId);
    const jabatan = userProfile?.jabatan;
    const unitKerja = userProfile?.unit_kerja;

    if (!jabatan || !unitKerja) {
      const pesanPeringatan = '⚠️ Untuk hasil terbaik dari AI, mohon lengkapi /profil Anda terlebih dahulu.\n\n'
        + 'Pastikan Anda telah mengatur:\n'
        + '• *Jabatan*: `/ubahjabatan <jabatan>`\n'
        + '• *Unit Kerja*: `/ubahunit <unit kerja>`\n\n'
        + 'Setelah profil lengkap, silakan kirim ulang laporan Anda.';

      return bot.sendMessage(chatId, pesanPeringatan, { parse_mode: 'Markdown' });
    }

    const loadingMsg = await bot.sendMessage(chatId, '⏳ Memproses laporan...');

    try {
      const { text: deskripsi, duration } = await perbaikiDeskripsi(rawText, unitKerja, jabatan);
      const laporan = {
        deskripsi: cleanDeskripsiAI(deskripsi),
        raw: rawText,
        username,
        chatId,
        messageId: loadingMsg.message_id,
        duration
      };

      if (msg.photo) {
        const fileId = msg.photo.at(-1).file_id;
        const file = await bot.getFile(fileId);
        const fileExt = path.extname(file.file_path);
        const fileName = `${userId}_${Date.now()}${fileExt}`;
        const destPath = path.join(__dirname, '../uploads', fileName);

        await downloadFile(file.file_path, destPath);
        laporan.fileName = fileName;
      }

      pendingLaporan.set(userId, laporan);

      const caption = generateCaption(laporan);
      await bot.editMessageText(caption, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: getReplyMarkup()
      });
    } catch (err) {
      console.error('❌ Gagal proses:', err);
      await bot.editMessageText('❌ Gagal memproses laporan.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    }
  };
};
