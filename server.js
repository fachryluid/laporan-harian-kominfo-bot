const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>💀💀💀</title></head>
      <body style="margin:0; background-color:black; display:flex; align-items:center; justify-content:center; height:100vh;">
        <video width="100%" height="100%" controls loop>
          <source src="/assets/rickroll.mp4" type="video/mp4" />
          Browsermu tidak mendukung pemutar video.
        </video>
      </body>
    </html>
  `);
});

app.use((req, res) => {
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});