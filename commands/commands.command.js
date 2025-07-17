module.exports = (bot) => {
  bot.onText(/\/commands/, async (msg) => {
    bot.sendMessage(msg.chat.id, `
📋 *Perintah yang tersedia:*

📥 *Laporan*
• /unduh - Unduh laporan untuk bulan ini.
• /unduh [Bulan Tahun] - Unduh laporan bulan tertentu. Contoh: \`/unduh Juni 2025\`.
• /hapuslaporanterakhir - Hapus laporan terakhir yang kamu kirim.

👤 *Profil*
• /profil - Lihat data profilmu (nama, NIP, jabatan, unit kerja).
• /ubahnama <nama> - Ubah nama profilmu. Contoh: \`/ubahnama Siti Aminah\`.
• /ubahnip <NIP> - Ubah nomor NIP. Contoh: \`/ubahnip 198909092020121001\`.
• /ubahjabatan <jabatan> - Ubah jabatan. Contoh: \`/ubahjabatan Pranata Komputer Ahli Pertama\`.
• /ubahunit <unit kerja> - Ubah unit kerja. Contoh: \`/ubahunit Dinas Komunikasi, Informatika, Statistik Dan Persandian\`.

📋 *Tips*
- Perbarui profil agar AI dapat memperbaiki deskripsi laporan dengan lebih baik.
  `, { parse_mode: 'Markdown' });
  });
};
