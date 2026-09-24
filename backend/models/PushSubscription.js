const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');

// Guarda as inscrições de notificação push do navegador de cada usuário
// (formato padrão da Web Push API: endpoint + chaves de criptografia).
const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  p256dh: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  auth: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'push_subscriptions',
  timestamps: true,
});

module.exports = PushSubscription;
