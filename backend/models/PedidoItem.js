const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

const PedidoItem = sequelize.define('PedidoItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quantidade: {
    // DECIMAL (e não INTEGER) porque itens vendidos por kg têm quantidade
    // fracionária (ex: 0.750 kg).
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  variacao_nome: {
    // "Foto" do nome da variação escolhida no momento da compra, pra não
    // depender da variação continuar existindo/igual lá na frente.
    type: DataTypes.STRING,
    allowNull: true,
  },
  variacao_ajuste_preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'pedido_itens',
  timestamps: false,
});

module.exports = PedidoItem;