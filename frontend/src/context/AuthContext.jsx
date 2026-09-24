import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      const salvo = localStorage.getItem('authUsuario');
      setUsuario(salvo ? JSON.parse(salvo) : { email: 'Usuário Logado', role: 'dono' });
    }
    setLoading(false);
  }, [token]);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/login', { email, senha });
      const { token, usuario: usuarioLogado } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUsuario', JSON.stringify(usuarioLogado));
      api.defaults.headers.Authorization = `Bearer ${token}`;

      setToken(token);
      setUsuario(usuarioLogado);

      navigate('/admin');
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error(error.response?.data?.message || 'Email ou senha inválidos.');
    }
  };

  const registro = async (nome, email, senha) => {
    try {
      await api.post('/registro', { nome, email, senha });
      toast.success('Registro realizado com sucesso! Faça o login.');
      navigate('/login');
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar. Verifique os dados.');
    }
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsuario');
    delete api.defaults.headers.Authorization;
    navigate('/login');
  };

  const ehDono = usuario?.role !== 'atendente';

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, registro, logout, ehDono }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
