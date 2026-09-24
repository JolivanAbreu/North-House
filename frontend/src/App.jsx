import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts e Rotas Protegidas
import Painel from './pages/admin/Painel.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicLayout from './components/PublicLayout.jsx';

// Páginas Admin
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Comandas from './pages/admin/Comandas.jsx';
import GerenciarCategorias from './pages/admin/GerenciarCategorias.jsx';
import GerenciarProdutos from './pages/admin/GerenciarProdutos.jsx';
import GerenciarPedidos from './pages/admin/GerenciarPedidos.jsx';
import GerenciarCupons from './pages/admin/GerenciarCupons.jsx';
import Relatorios from './pages/admin/Relatorios.jsx';
import PerfilDaLoja from './pages/admin/PerfilDaLoja.jsx';
import Equipe from './pages/admin/Equipe.jsx';
import Clientes from './pages/admin/Clientes.jsx';
import EsqueciSenha from './pages/EsqueciSenha.jsx';
import RedefinirSenha from './pages/RedefinirSenha.jsx';

// Páginas Públicas
import Vitrine from './pages/public/Vitrine.jsx';
import Carrinho from './pages/public/Carrinho.jsx';
import PedidoStatus from './pages/public/PedidoStatus.jsx';

// Erro
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <Routes>
      {/* Rotas Públicas (Vitrine, Carrinho, Status do Pedido) */}
      <Route element={<PublicLayout />}>
        <Route path="/loja/:usuarioId" element={<Vitrine />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/pedido/:token" element={<PedidoStatus />} />
      </Route>

      {/* Rotas de Autenticação (Admin) */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />

      {/* Rotas Protegidas (Painel Admin) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Painel />
          </ProtectedRoute>
        }
      >
        <Route index element={<Comandas />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="categorias" element={<GerenciarCategorias />} />
        <Route path="produtos" element={<GerenciarProdutos />} />
        <Route path="pedidos" element={<GerenciarPedidos />} />
        <Route path="cupons" element={<GerenciarCupons />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="perfil" element={<PerfilDaLoja />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="equipe" element={<Equipe />} />
      </Route>

      {/* Rota Raiz */}
      <Route path="/" element={<Navigate to="/loja/1" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
