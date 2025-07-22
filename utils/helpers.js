const { execSync } = require('child_process');
const { storageUrl } = require('../config/keys');

exports.getReplyMarkup = () => ({
  inline_keyboard: [[
    { text: '✅ Simpan', callback_data: 'simpan' },
    { text: '✅ Asli', callback_data: 'simpan_asli' },
    { text: '♻️ Ulangi', callback_data: 'ulang' },
    { text: '❌ Batal', callback_data: 'batal' }
  ]]
});

exports.generateCaption = ({ fileName, deskripsi, retryCount, duration }) => {
  const retryNote = retryCount ? ` (Ulangi: ${retryCount})` : '';
  const durationText = duration ? `\n\n⏱️ _Diproses dalam ${(duration / 1000).toFixed(2)} detik_` : '';

  let caption = `💬 *Deskripsi yang sudah diperbaiki${retryNote}:*\n\n${deskripsi}`;

  if (fileName) {
    caption = `🖼️ Foto: Klik untuk lihat\n\n${caption}`;
  }

  return caption + durationText;
};

exports.cleanDeskripsiAI = (text) => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/^["“]|["”]$/g, '')                    // hilangkan kutip awal/akhir
    .replace(/^.*?:\s*/i, '')                       // hilangkan awalan seperti "Deskripsi:" atau sejenisnya
    .replace(/\s+/g, ' ');                          // normalisasi spasi berlebih
};

exports.getLatestGitTag = () => {
  try {
    // Get latest tag, fallback to 'v1.0.0' if not found
    return execSync('git describe --tags --abbrev=0').toString().trim();
  } catch (e) {
    return 'v1.0.0';
  }
}
