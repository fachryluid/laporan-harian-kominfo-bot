const db = require("../models");

db.sequelize.sync({ alter: true });