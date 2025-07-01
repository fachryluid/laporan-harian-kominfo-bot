const db = require('../models');

module.exports = (bot) => {
  bot.onText(/\/profil/, async (msg) => {
    const userId = msg.from.id;
    const user = await db.UserProfile.findByPk(userId);

    const fullname = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ''}`;
    const nip = user?.nip || '_Belum diisi_';
    const jabatan = user?.jabatan || '_Belum diisi_';
    const unitKerja = user?.unit_kerja || '_Belum diisi_';

    const response = `📄 *Profil Anda:*\n`
      + `Nama: ${fullname}\n`
      + `NIP: ${nip}\n`
      + `Jabatan: ${jabatan}\n`
      + `Unit Kerja: ${unitKerja}\n\n`
      + `✏️ *Perintah untuk mengubah profil:*\n`
      + `/ubahnama <nama lengkap>\n`
      + `/ubahnip <nomor NIP>\n`
      + `/ubahjabatan <jabatan>\n`
      + `/ubahunit <unit kerja>`;

    bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown' });
  });
}