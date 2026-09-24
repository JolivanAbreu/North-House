import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PedidoStatus = () => {
  return (
    <div className="max-w-xl mx-auto text-center py-12 animate-fadeIn">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Pedido Realizado com Sucesso!</h1>
      <p className="text-stone-600 mb-6">
        Seu pedido foi enviado ao estabelecimento e já está em processamento.
      </p>
      <Link
        to="/"
        className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
};

export default PedidoStatus;