require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./database/config');
const path = require('path');
const fs = require('fs');

// --- 1. Importar Rotas ---
const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const insumoRoutes = require('./routes/insumoRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const publicRoutes = require('./routes/publicRoutes');
const pedidoAdminRoutes = require('./routes/pedidoAdminRoutes');
const estatisticasRoutes = require('./routes/estatisticasRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const cupomRoutes = require('./routes/cupomRoutes');
const equipeRoutes = require('./routes/equipeRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const pushRoutes = require('./routes/pushRoutes');
const mesaRoutes = require('./routes/mesaRoutes');

// --- 2. Importar Modelos ---
const Usuario = require('./models/Usuario');
const Categoria = require('./models/Categoria');
const Insumo = require('./models/Insumo');
const Produto = require('./models/Produto');
const FichaTecnica = require('./models/FichaTecnica');
const Pedido = require('./models/Pedido');
const PedidoItem = require('./models/PedidoItem');
const Cupom = require('./models/Cupom');
const VariacaoProduto = require('./models/VariacaoProduto');
const PushSubscription = require('./models/PushSubscription');
const Mesa = require('./models/Mesa');

// --- 3. Definir Associações ---
Usuario.hasMany(Insumo);
Insumo.belongsTo(Usuario);

Usuario.hasMany(Categoria);
Categoria.belongsTo(Usuario);

Usuario.hasMany(Produto);
Produto.belongsTo(Usuario);

// Chave explícita (ver comentário em models/Categoria.js sobre "Categorium").
Categoria.hasMany(Produto, { foreignKey: 'CategoriaId' });
Produto.belongsTo(Categoria, { foreignKey: 'CategoriaId' });

Produto.belongsToMany(Insumo, {
  through: FichaTecnica,
  foreignKey: 'ProdutoId',
});
Insumo.belongsToMany(Produto, {
  through: FichaTecnica,
  foreignKey: 'InsumoId',
});

Usuario.hasMany(Pedido);
Pedido.belongsTo(Usuario);

Usuario.hasMany(Cupom);
Cupom.belongsTo(Usuario);

Pedido.hasMany(PedidoItem);
PedidoItem.belongsTo(Pedido);

Produto.hasMany(PedidoItem);
PedidoItem.belongsTo(Produto);

Produto.hasMany(VariacaoProduto);
VariacaoProduto.belongsTo(Produto);

Usuario.hasMany(PushSubscription);
PushSubscription.belongsTo(Usuario);

Usuario.hasMany(Mesa);
Mesa.belongsTo(Usuario);

Mesa.hasMany(Pedido);
Pedido.belongsTo(Mesa);
// --- Fim das Associações ---

// Rede de segurança: por padrão, o Node encerra o processo inteiro quando uma
// Promise rejeitada não é tratada (unhandledRejection) ou quando ocorre uma
// exceção fora de qualquer try/catch (uncaughtException). Isso derrubaria o
// servidor inteiro por causa de um único erro pontual. Aqui apenas registramos
// o erro no log e mantemos o servidor no ar.
process.on('unhandledRejection', (reason) => {
  console.error('AVISO: Promise rejeitada sem tratamento:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('AVISO: Exceção não tratada:', error);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Lógica de Uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Middlewares
app.use(cors());
app.use(express.json());

// --- 4. Usar as Rotas ---
app.use('/api', authRoutes);
app.use('/api', categoriaRoutes);
app.use('/api', insumoRoutes);
app.use('/api', produtoRoutes);
app.use('/api', publicRoutes); 
app.use('/api', pedidoAdminRoutes);
app.use('/api', estatisticasRoutes);
app.use('/api', perfilRoutes);
app.use('/api', cupomRoutes);
app.use('/api', equipeRoutes);
app.use('/api', clienteRoutes);
app.use('/api', pushRoutes);
app.use('/api', mesaRoutes);

// Teste de conexão e sincronização do DB
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o MariaDB estabelecida com sucesso.');

    // Sincroniza os modelos
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados com o banco de dados.');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  }
}

startServer();