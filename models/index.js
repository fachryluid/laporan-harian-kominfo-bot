const Sequelize = require("sequelize")
const config = require('./../config/keys').db
const sequelize = new Sequelize(
  config.name,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect
  }
)

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.Laporan = require("./laporan.model.js")(sequelize, Sequelize)
db.UserProfile = require("./user_profile.model.js")(sequelize, Sequelize)

module.exports = db