import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.mjs';
import { inputClasses, Field } from '../components/ui/Input.jsx';
import Logo from '../components/Logo.jsx';

const RedefinirSenha = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/redefinir-senha/${token}`, { novaSenha });
      toast.success('Senha redefinida com sucesso! Faça login com a nova senha.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.response?.data?.message || 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 px-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-3" />
          <h2 className="text-2xl font-bold font-display text-stone-900">Criar nova senha</h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card border border-stone-100 space-y-5">
          <Field label="Nova senha">
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className={`${inputClasses} pl-10`}
                required
                minLength={6}
              />
            </div>
          </Field>
          <Field label="Confirmar nova senha">
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={`${inputClasses} pl-10`}
                required
                minLength={6}
              />
            </div>
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft disabled:bg-stone-300"
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
          <p className="text-center text-sm">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-brand-600 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RedefinirSenha;
