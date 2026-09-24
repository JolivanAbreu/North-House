const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

// Ex: "Tamanho P/M/G", "Sabor Chocolate", "+ Granulado".
// ajuste_preco soma (ou subtrai, se negativo) em cima do preco_venda do produto.
const VariacaoProduto = sequelize.define('VariacaoProduto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ajuste_preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'variacoes_produto',
  timestamps: true,
});

module.exports = VariacaoProduto;
