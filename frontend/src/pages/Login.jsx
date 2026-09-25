import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { inputClasses, Field } from '../components/ui/Input.jsx';
import Logo from '../components/Logo.jsx';
import { BRAND } from '../config/brand.mjs';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, senha);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 px-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-2" />
          <h2 className="text-2xl font-bold font-display text-stone-900">{BRAND.nome}</h2>
          <p className="text-stone-500 text-sm mt-1">Acesse o sistema de comandas</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card border border-stone-100 space-y-5">
          <Field label="Email">
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClasses} pl-10`}
                required
              />
            </div>
          </Field>
          <Field label="Senha">
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={`${inputClasses} pl-10`}
                required
              />
            </div>
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft disabled:bg-stone-300"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="text-center text-sm">
            <Link to="/esqueci-senha" className="text-stone-500 hover:text-brand-600 hover:underline">
              Esqueci minha senha
            </Link>
          </p>
          <p className="text-center text-sm text-stone-500">
            Não tem uma conta?{' '}
            <Link to="/registro" className="text-brand-600 font-medium hover:underline">
              Registre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
