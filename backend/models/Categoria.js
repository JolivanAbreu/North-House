const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');
const Usuario = require('./Usuario');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    // Separa categorias de produtos de mercearia (cereais, carnes, frios...)
    // das categorias de itens do cardápio do restaurante (almoço, bebidas...).
    type: DataTypes.ENUM('mercearia', 'cardapio'),
    allowNull: false,
    defaultValue: 'cardapio',
  },
}, {
  tableName: 'categorias',
  timestamps: true,
});

module.exports = Categoria;