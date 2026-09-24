import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
      <Compass className="w-8 h-8 text-brand-500" strokeWidth={1.5} />
    </div>
    <h1 className="text-5xl font-bold font-display text-stone-900">404</h1>
    <p className="text-stone-500 mt-2 max-w-sm">
      Esta página não existe ou o link que você acessou está incorreto.
    </p>
    <Link
      to="/"
      className="mt-6 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft"
    >
      Voltar ao início
    </Link>
  </div>
);

export default NotFound;
