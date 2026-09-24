const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const FichaTecnica = sequelize.define('FichaTecnica', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quantidade_usada: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
  },
}, {
  tableName: 'ficha_tecnica',
  timestamps: false,
});

module.exports = FichaTecnica;