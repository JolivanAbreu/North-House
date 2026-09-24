import React, { useState } from 'react';
import { Store, User, Mail, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { inputClasses, Field } from '../components/ui/Input.jsx';

const Registro = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { registro } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await registro(nome, email, senha);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 px-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="flex flex-col items-center mb-8">
          <span className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-soft mb-3">
            <Store className="w-6 h-6 text-white" />
          </span>
          <h2 className="text-2xl font-bold font-display text-stone-900">Crie sua loja</h2>
          <p className="text-stone-500 text-sm mt-1">Comece a vender em minutos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card border border-stone-100 space-y-5">
          <Field label="Nome">
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`${inputClasses} pl-10`}
                required
              />
            </div>
          </Field>
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
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
          <p className="text-center text-sm text-stone-500">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Registro;
