require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./models');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

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

async function startBot() {
  try {
    await waitForDb();
    await db.sequelize.sync();

    // Handle commands
    const commandsPath = path.join(__dirname, 'commands');
    fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.command.js'))
      .forEach(file => {
        const command = require(path.join(commandsPath, file));
        if (typeof command === 'function') {
          command(bot); // inject bot
        }
      });

    // Buat folder uploads jika belum ada
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Handle pesan teks dan foto
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ''}`;
      const caption = msg.caption;
      const text = msg.text;

      try {
        if (msg.photo) {
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          const file = await bot.getFile(fileId);
          const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
          const fileExt = path.extname(file.file_path);
          const fileName = `${userId}_${Date.now()}${fileExt}`;
          const destPath = path.join(__dirname, 'uploads', fileName);

          const https = require('https');
          const fileStream = fs.createWriteStream(destPath);
          https.get(fileUrl, (res) => {
            res.pipe(fileStream);
            fileStream.on('finish', async () => {
              fileStream.close();
              const deskripsi = caption || '(Tidak ada deskripsi)';
              await db.Laporan.create({ user_id: userId, username, deskripsi, foto: fileName });
              bot.sendMessage(chatId, '📸 Laporan dengan foto berhasil disimpan!');
            });
          });
        } else if (text && !text.startsWith('/')) {
          await db.Laporan.create({ user_id: userId, username, deskripsi: text });
          bot.sendMessage(chatId, '📝 Laporan berhasil disimpan!');
        }
      } catch (err) {
        console.error('❌ Gagal menyimpan laporan:', err);
        bot.sendMessage(chatId, '❌ Gagal menyimpan laporan.');
      }
    });

    // Handle unknown command
    bot.onText(/^\/(.+)/, (msg, match) => {
      const knownCommands = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.command.js'))
        .map(file => file.split('.')[0]);

      const inputCommand = match[1].split(' ')[0];
      if (!knownCommands.includes(inputCommand)) {
        bot.sendMessage(msg.chat.id, `❌ Perintah /${inputCommand} tidak dikenali.\nCoba ketik /unduh untuk mengunduh laporanmu.`);
      }
    });
  } catch (err) {
    console.error('❌ Gagal koneksi ke database setelah retry:', err);
    process.exit(1); // Exit agar container bisa restart jika pakai restart policy
  }
}

startBot();