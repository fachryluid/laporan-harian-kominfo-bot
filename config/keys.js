require('dotenv').config();
module.exports = {
  app: {
    name: process.env.APP_NAME || 'Server App',
    url: process.env.URL
  },
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  db: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
  secret: process.env.TOKEN,
  storageUrl: process.env.STORAGE_URL || 'http://localhost:3000/uploads',
};