const fs = require('fs');
const https = require('https');
const path = require('path');

exports.downloadFile = function (filePath, destPath) {
  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(destPath);
    https.get(url, res => {
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close(resolve);
      });
    }).on('error', reject);
  });
};