const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');
const Categoria = require('./Categoria');
const Usuario = require('./Usuario');

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preco_venda: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  disponivel: {
    // Permite "pausar" a venda de um produto sem precisar apagar ele.
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  unidade_venda: {
    // 'unidade': preco_venda é por unidade/item. 'kg': preco_venda é por
    // quilo, e a quantidade lançada no pedido é o peso (ex: 0.5 = 500g).
    type: DataTypes.ENUM('unidade', 'kg'),
    allowNull: false,
    defaultValue: 'unidade',
  },
  quantidade_em_estoque: {
    // Estoque próprio do produto pronto (usado principalmente pelos
    // produtos de mercearia, que não passam por Ficha Técnica/Insumo).
    // Null = sem controle de estoque para esse produto.
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
  },
  codigo_barras: {
    // Código EAN opcional, para permitir localizar o produto via leitor de
    // código de barras no futuro.
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'produtos'
});

Produto.belongsTo(Categoria, { foreignKey: 'CategoriaId' });
Produto.belongsTo(Usuario, { foreignKey: 'UsuarioId' });

module.exports = Produto;