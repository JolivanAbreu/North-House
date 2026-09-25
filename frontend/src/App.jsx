import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout e rota protegida
import Painel from './pages/admin/Painel.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Autenticação
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import EsqueciSenha from './pages/EsqueciSenha.jsx';
import RedefinirSenha from './pages/RedefinirSenha.jsx';

// Painel do restaurante
import Comandas from './pages/admin/Comandas.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import GerenciarCategorias from './pages/admin/GerenciarCategorias.jsx';
import GerenciarProdutos from './pages/admin/GerenciarProdutos.jsx';
import GerenciarPedidos from './pages/admin/GerenciarPedidos.jsx';
import Relatorios from './pages/admin/Relatorios.jsx';
import PerfilDaLoja from './pages/admin/PerfilDaLoja.jsx';
import Equipe from './pages/admin/Equipe.jsx';
import Clientes from './pages/admin/Clientes.jsx';

import NotFound from './pages/NotFound.jsx';

// O sistema do Casa Nova é de uso interno do restaurante: não existe mais
// vitrine pública, carrinho nem página de status de pedido para o cliente.
function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />

      <Routes>
        {/* Autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />

        {/* Painel */}
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
          <Route path="cardapio" element={<GerenciarProdutos tipoFixo="cardapio" />} />
          <Route path="mercearia" element={<GerenciarProdutos tipoFixo="mercearia" />} />
          <Route path="produtos" element={<Navigate to="/admin/cardapio" replace />} />
          <Route path="categorias" element={<GerenciarCategorias />} />
          <Route path="pedidos" element={<GerenciarPedidos />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="perfil" element={<PerfilDaLoja />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="equipe" element={<Equipe />} />
        </Route>

        {/* A raiz leva direto para as comandas (ou para o login, se deslogado) */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
