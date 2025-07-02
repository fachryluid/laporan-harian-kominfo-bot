module.exports = (sequelize, Sequelize) => {
  const Laporan = sequelize.define("reports", {
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    deskripsi: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    deskripsi_ai: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    foto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });

  return Laporan;
};