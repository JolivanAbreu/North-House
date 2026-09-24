const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

// Mesas do restaurante, usadas pelas comandas locais. Cada loja tem seu
// próprio conjunto de mesas (escopado por UsuarioId, como os demais models).
const Mesa = sequelize.define('Mesa', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  numero: {
    // Texto e não número puro pra permitir "Balcão 1", "Mesa 12A", etc.
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('livre', 'ocupada'),
    allowNull: false,
    defaultValue: 'livre',
  },
}, {
  tableName: 'mesas',
  timestamps: true,
});

module.exports = Mesa;
