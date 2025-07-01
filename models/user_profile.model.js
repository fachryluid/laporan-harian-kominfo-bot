module.exports = (sequelize, Sequelize) => {
  const UserProfile = sequelize.define("user_profiles", {
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    nama: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    nip: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    jabatan: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    unit_kerja: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
  });

  return UserProfile;
};
