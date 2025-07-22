const axios = require('axios');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function callGeminiAPI(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
    }
  });

  const text = response.text;
  return text || null;
}

async function callOllamaAPI(prompt) {
  const url = 'https://api-chat.buolkab.go.id/v1/chat';
  const payload = {
    model: 'hf.co/QuantFactory/gemma2-9b-cpt-sahabatai-v1-instruct-GGUF',
    prompt,
    stream: false
  };
  const res = await axios.post(url, payload);
  return res.data?.response || null;
}

/**
 * Fungsi utama untuk memperbaiki deskripsi kegiatan.
 * Fungsi ini akan mencoba memanggil Gemini API terlebih dahulu, dan jika gagal
 * atau tidak ada API key, akan beralih ke Ollama API sebagai fallback.
 */
exports.perbaikiDeskripsi = async function (desk, unitKerja = '', jabatan = '') {
  // Prompt tetap sama, dirancang untuk memberikan instruksi yang jelas ke model AI
  const prompt = `Berikut ini adalah deskripsi kegiatan harian dari seorang pegawai:\n\nTeks asli:\n\"${desk}\"\n\nInformasi tambahan:\nUnit Kerja: ${unitKerja}\nJabatan: ${jabatan}\n\nTugas Anda adalah memperbaiki kalimat tersebut agar:\n- Menggunakan bahasa formal sesuai standar laporan harian instansi pemerintahan.\n- Kalimat menjadi lengkap dan rapi.\n- Secara implisit mencerminkan jabatan dan unit kerja pegawai (tanpa menyebutnya secara kaku).\n\nBerikan hasil akhirnya **dalam satu kalimat yang utuh**, tanpa label, penjelasan, atau pengantar tambahan.`;

  const prompt_v2 = `
Anda adalah seorang asisten ahli administrasi pemerintahan yang bertugas membantu pegawai menyusun laporan kegiatan harian dengan bahasa yang formal, baku, dan profesional.

**Tugas Utama:**
Perbaiki dan sempurnakan deskripsi kegiatan harian berikut menjadi satu kalimat laporan yang utuh dan profesional.

**Aturan Main:**
1.  Fokus utama adalah mengubah frasa singkat menjadi kalimat kerja aktif (diawali dengan kata kerja seperti "Melakukan", "Melaksanakan", "Menyusun", "Menganalisis", dll).
2.  Jika ada informasi 'Tujuan Kegiatan', gunakan itu untuk memperkaya deskripsi. Jika tidak ada, simpulkan tujuan singkatnya dari Jabatan dan Unit Kerja.
3.  Pastikan hasil akhir mencerminkan profesionalitas jabatan dan fungsi unit kerja secara implisit.
4.  **JANGAN** menambahkan detail teknis atau informasi baru yang tidak relevan dengan input.

**Contoh Transformasi yang Baik:**
-   **Input:** "rapat koordinasi web", **Jabatan:** "Pranata Komputer", **Tujuan:** "persiapan integrasi data"
-   **Output yang Diharapkan:** Melaksanakan rapat koordinasi teknis terkait pengembangan situs web untuk persiapan integrasi data daerah.

---
**Data Kegiatan untuk Diperbaiki:**

Teks Asli: "${desk}"
Unit Kerja: "${unitKerja}"
Jabatan: "${jabatan}"

**Hasil Akhir (Hanya satu kalimat):**
`;

  const geminiApiKey = process.env.GEMINI_API_KEY;

  // --- Prioritas 1: Coba API Gemini dengan SDK resmi ---
  if (geminiApiKey) {
    const startTime = Date.now();
    try {
      console.log('⏳ Mencoba perbaikan dengan Gemini API...');
      const result = await callGeminiAPI(prompt_v2);
      const duration = Date.now() - startTime;
      console.log(`⏱️  Waktu respons Gemini API: ${duration}ms`);
      if (result) {
        console.log('✅ Berhasil menggunakan Gemini API.');
        return { text: result, duration };
      }
      console.warn('⚠️ Gemini API tidak memberikan hasil, mencoba fallback ke Ollama lokal.');
    } catch (err) {
      const duration = Date.now() - startTime;
      // Tangani error yang mungkin spesifik untuk SDK
      const errorMessage = err.message || 'Terjadi kesalahan tidak diketahui';
      console.warn(`⚠️ Gagal menggunakan Gemini API: ${errorMessage}. Waktu: ${duration}ms. Mencoba fallback ke Ollama lokal.`);
    }
  } else {
    console.log('ℹ️  GEMINI_API_KEY tidak diatur, langsung menggunakan Ollama API lokal.');
  }

  // --- Prioritas 2 (Fallback): Gunakan API Ollama lokal ---
  const startTime = Date.now();
  try {
    console.log('⏳ Mencoba perbaikan dengan Ollama API lokal...');
    const result = await callOllamaAPI(prompt_v2);
    const duration = Date.now() - startTime;
    console.log(`⏱️  Waktu respons Ollama API: ${duration}ms`);
    if (result) {
      console.log('✅ Berhasil menggunakan Ollama API lokal.');
      return { text: result, duration };
    }
    console.warn('⚠️ Ollama API juga tidak memberikan hasil, mengembalikan teks asli.');
    return { text: desk, duration: 0 }; // Kembalikan teks asli jika Ollama juga gagal
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Gagal generate dengan semua provider: ${err.message}. Waktu: ${duration}ms. Mengembalikan teks asli.`);
    return { text: desk, duration: 0 }; // Kembalikan teks asli jika terjadi error final
  }
};