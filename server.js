const express = require('express');
const path = require('path');
const { getLatestGitTag } = require('./utils/helpers');
require('dotenv').config();

const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
  const version = getLatestGitTag();
  res.render('index', { version });
});

app.use((req, res) => {
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});