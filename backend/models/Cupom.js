const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const Cupom = sequelize.define('Cupom', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    // 'percentual' -> valor é uma porcentagem (ex: 10 = 10%)
    // 'fixo' -> valor é um valor fixo em R$
    type: DataTypes.ENUM('percentual', 'fixo'),
    allowNull: false,
    defaultValue: 'percentual',
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  validade: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usos_max: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  usos_atual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  pedido_minimo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'cupons',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['UsuarioId', 'codigo'] }
  ]
});

module.exports = Cupom;
