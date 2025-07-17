const { execSync } = require('child_process');
const { storageUrl } = require('../config/keys');

exports.getReplyMarkup = () => ({
  inline_keyboard: [[
    { text: '✅ Simpan', callback_data: 'simpan' },
    { text: '♻️ Ulangi', callback_data: 'ulang' },
    { text: '❌ Batal', callback_data: 'batal' }
  ]]
});

exports.generateCaption = ({ fileName, deskripsi, retryCount }) => {
  const retryNote = retryCount ? ` (${retryCount})` : '';
  return fileName
    ? `🖼️ Foto: [Klik untuk lihat](${storageUrl}/${fileName})\n\n💬 *Deskripsi yang sudah diperbaiki${retryNote}:*\n\n${deskripsi}`
    : `💬 *Deskripsi yang sudah diperbaiki${retryNote}:*\n\n${deskripsi}`;
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

