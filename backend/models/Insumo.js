const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const Insumo = sequelize.define('Insumo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  unidade_uso: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unidade_compra: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  custo_compra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fator_conversao: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 1.000
  },

  quantidade_em_estoque: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0.000
  },
}, {
  tableName: 'insumos',
  timestamps: true,
});

module.exports = Insumo;