const db = require('../models');

module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;
    const userProfile = await db.UserProfile.findByPk(userId);

    const chatId = msg.chat.id;
    const username = userProfile.nama || msg.from.first_name || 'Pengguna';

    const welcomeMessage = `
👋 Hai, ${username}!
Selamat datang di *Bot Laporan Harian Diskominfo-SP Kab. Buol*.

📝 *Cara mengisi laporan:*
- Kirim *teks biasa* → akan disimpan sebagai laporan harian.
- Kirim *foto dengan caption* → akan disimpan beserta gambar.

📋 *Perintah yang tersedia:*

📥 *Laporan*
• /unduh - Unduh semua laporanmu dalam format Excel.
• /unduh [Bulan Tahun] - Unduh laporan bulan tertentu. Contoh: \`/unduh Juni 2025\`.
• /hapuslaporanterakhir - Hapus laporan terakhir yang kamu kirim.

👤 *Profil*
• /profil - Lihat data profilmu (nama, NIP, jabatan, unit kerja).
• /ubahnama <nama> - Ubah nama profilmu. Contoh: \`/ubahnama Siti Aminah\`.
• /ubahnip <NIP> - Ubah nomor NIP. Contoh: \`/ubahnip 198909092020121001\`.
• /ubahjabatan <jabatan> - Ubah jabatan. Contoh: \`/ubahjabatan Pranata Komputer Ahli Pertama\`.
• /ubahunit <unit kerja> - Ubah unit kerja. Contoh: \`/ubahunit Dinas Komunikasi, Informatika, Statistik Dan Persandian\`.

🚀 Silakan mulai dengan mengirim laporan harianmu sekarang juga.

Bot ini dikembangkan oleh *Bidang E-Government - Diskominfo-SP Kab. Buol*. © 2025. All rights reserved.
    `;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  });
};