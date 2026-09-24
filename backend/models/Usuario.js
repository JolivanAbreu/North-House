const { DataTypes } = require('sequelize');
const sequelize = require('../database/config');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  senha_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  nome_loja: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Minha Loja'
  },
  telefone_whatsapp: {
    type: DataTypes.STRING, 
    allowNull: true,
  },
  link_instagram: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // --- Arquivamento automático de pedidos ---
  dias_para_arquivar_pedidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
  },

  // --- Horário de funcionamento da loja ---
  // JSON com um objeto por dia da semana: { seg: {ativo, abre, fecha}, ter: {...}, ... }
  horarios_funcionamento: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  loja_pausada: {
    // Botão de emergência: fecha a loja na hora, independente do horário configurado.
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  // --- Recuperação de senha ---
  reset_senha_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_senha_expira: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // --- Múltiplos atendentes ---
  role: {
    type: DataTypes.ENUM('dono', 'atendente'),
    allowNull: false,
    defaultValue: 'dono',
  },
  UsuarioDonoId: {
    // Preenchido só quando role = 'atendente'. Aponta pro usuário "dono" da loja
    // cujos dados (produtos, pedidos, insumos...) esse atendente enxerga e gerencia.
    type: DataTypes.INTEGER,
    allowNull: true,
  },

}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha_hash) {
        const salt = await bcrypt.genSalt(10);
        usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      // Só re-hasheia se a senha realmente mudou nessa atualização
      // (evita hashear de novo um hash que já foi salvo antes).
      if (usuario.changed('senha_hash') && usuario.senha_hash) {
        const salt = await bcrypt.genSalt(10);
        usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, salt);
      }
    },
  },
});

Usuario.prototype.validarSenha = function (senha) {
  return bcrypt.compare(senha, this.senha_hash);
};

module.exports = Usuario;