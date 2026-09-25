import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.mjs';
import { inputClasses, Field } from '../components/ui/Input.jsx';
import Logo from '../components/Logo.jsx';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/esqueci-senha', { email });
      setEnviado(true);
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error);
      toast.error('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 px-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-2" />
          <h2 className="text-2xl font-bold font-display text-stone-900">Redefinir senha</h2>
          <p className="text-stone-500 text-sm mt-1 text-center">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-100">
          {enviado ? (
            <p className="text-sm text-stone-600 text-center">
              Se esse e-mail estiver cadastrado, você vai receber um link de redefinição em instantes.
              Confira também a caixa de spam.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft disabled:bg-stone-300"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
          )}
          <p className="text-center text-sm mt-5">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-stone-500 hover:text-brand-600 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EsqueciSenha;
