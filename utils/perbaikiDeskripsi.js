const axios = require('axios');

exports.perbaikiDeskripsi = async function (desk, unitKerja = '', jabatan = '') {
  const prompt = `Berikut ini adalah deskripsi kegiatan harian dari seorang pegawai:\n\nTeks asli:\n\"${desk}\"\n\nInformasi tambahan:\nUnit Kerja: ${unitKerja}\nJabatan: ${jabatan}\n\nTugas Anda adalah memperbaiki kalimat tersebut agar:\n- Menggunakan bahasa formal sesuai standar laporan harian instansi pemerintahan.\n- Kalimat menjadi lengkap dan rapi.\n- Secara implisit mencerminkan jabatan dan unit kerja pegawai (tanpa menyebutnya secara kaku).\n\nBerikan hasil akhirnya **dalam satu kalimat yang utuh**, tanpa label, penjelasan, atau pengantar tambahan.`;
  try {
    const res = await axios.post('https://api-chat.buolkab.go.id/v1/chat', {
      model: 'hf.co/QuantFactory/gemma2-9b-cpt-sahabatai-v1-instruct-GGUF',
      prompt,
      stream: false
    });
    return res.data?.response || desk;
  } catch (err) {
    console.warn('⚠️ Gagal generate:', err.message);
    return desk;
  }
};