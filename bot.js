require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./models');
const fs = require('fs');
const { registerCommands, getCommandNames } = require('./utils/commandLoader');
const path = require('path');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: { timeout: 10 }
  }
});

const pendingLaporan = new Map();
const onMessage = require('./handlers/onMessage');
const onCallback = require('./handlers/onCallback');

async function waitForDb(maxRetries = 10, delay = 2000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await db.sequelize.authenticate();
      console.log('✅ Koneksi ke database berhasil.');
      return;
    } catch (err) {
      console.warn(`⏳ DB belum siap (percobaan ${i}/${maxRetries})`);
      if (i === maxRetries) throw err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

(async () => {
  try {
    await waitForDb();
    await db.sequelize.sync();

    // Memuat dan mendaftarkan semua command secara dinamis
    registerCommands(bot);

    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    bot.on('message', onMessage(bot, pendingLaporan));
    bot.on('callback_query', onCallback(bot, pendingLaporan));

    // Cek command tidak dikenal
    bot.onText(/^\/(.+)/, (msg, match) => {
      const knownCommands = getCommandNames();
      const inputCommand = match[1].split(' ')[0];
      if (!knownCommands.includes(inputCommand)) {
        bot.sendMessage(msg.chat.id, `❌ Perintah /${inputCommand} tidak dikenali.`);
      }
    });

    console.log('🤖 Bot Telegram siap menerima pesan...');
  } catch (err) {
    console.error('❌ Gagal koneksi ke database:', err);
    process.exit(1);
  }
})();

// Error polling
bot.on('polling_error', (err) => {
  console.error(`⚠️ Polling error: ${err.code || ''} ${err.message}`);
  if (['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(err.code)) {
    console.log('🔁 Mencoba reconnect ke Telegram dalam 5 detik...');
    setTimeout(() => bot.startPolling(), 5000);
  }
});

// Error fatal supaya proses tidak mati
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});