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
  // Sem isso o Sequelize "singulariza" Categoria como "Categorium": a API
  // devolvia produto.Categorium (o frontend lê produto.Categoria) e criava a
  // coluna fantasma CategoriumId. Resultado: todo produto aparecia sem
  // categoria e caía no Cardápio, mesmo cadastrado na Mercearia.
  name: { singular: 'Categoria', plural: 'Categorias' },
});

module.exports = Categoria;