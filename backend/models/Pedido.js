const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');
const { v4: uuidv4 } = require('uuid'); 

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  
  status_token: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    defaultValue: () => uuidv4(), 
  },

  nome_cliente: {
    // Comandas locais podem ser abertas sem nome de cliente (ex: comanda de
    // balcão) - por isso não é mais obrigatório no banco; o controller usa
    // um valor padrão ("Comanda Local") quando não informado.
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefone_cliente: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Recebido',
  },
  tipo_entrega: {
    // Valores usados hoje: 'Delivery', 'Retirada' (pedidos da vitrine) e
    // 'Local' (comanda aberta pelo próprio staff, mesa/balcão do restaurante).
    type: DataTypes.STRING,
    allowNull: false,
  },
  forma_pagamento_ilustrativa: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pago: {
    // Separado do "status" de preparo: uma comanda local pode estar
    // "Concluído" (pronta) sem necessariamente já ter sido paga - mas na
    // prática o fluxo atual só marca Concluído no momento de finalizar/pagar.
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  mesa_numero: {
    // "Foto" do número da mesa no momento da abertura da comanda, pra manter
    // o histórico mesmo que a mesa seja depois renomeada ou removida.
    type: DataTypes.STRING,
    allowNull: true,
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  cupom_codigo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  valor_desconto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  endereco_entrega: {
    // Preenchido só quando tipo_entrega = 'Delivery'. Guardado como texto único
    // (rua, número, bairro, complemento, CEP já formatados) pra manter o schema simples.
    type: DataTypes.TEXT,
    allowNull: true,
  },
  arquivado_em: {
    // Quando preenchido, o pedido some da tela principal de Pedidos (mas continua
    // existindo e aparece em Relatórios e na aba "Arquivados").
    type: DataTypes.DATE,
    allowNull: true,
  },

  // --- Pix real (Mercado Pago) ---
  pix_payment_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pix_qr_base64: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  pix_copia_cola: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'pedidos',
  timestamps: true,
});

module.exports = Pedido;