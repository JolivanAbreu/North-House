import React, { useState, useMemo } from "react";
import { Search, X, Wheat, Plus, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { inputClasses, Field } from "./ui/Input.jsx";

const NOVO_INSUMO_INICIAL = {
  nome: "",
  unidade_uso: "g",
  unidade_compra: "",
  custo_compra: "",
  fator_conversao: "",
};

const InsumoModal = ({ show, onClose, insumos, onAddInsumo, onCreateInsumo }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInsumoId, setSelectedInsumoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const [modoCriar, setModoCriar] = useState(false);
  const [novoInsumo, setNovoInsumo] = useState(NOVO_INSUMO_INICIAL);
  const [criando, setCriando] = useState(false);

  const insumosFiltrados = useMemo(() => {
    if (!searchTerm) return insumos;
    return insumos.filter((insumo) =>
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, insumos]);

  const insumoSelecionado = useMemo(() => {
    if (!selectedInsumoId) return null;
    return insumos.find((i) => i.id === parseInt(selectedInsumoId));
  }, [selectedInsumoId, insumos]);

  const resetTudo = () => {
    setSearchTerm("");
    setSelectedInsumoId("");
    setQuantidade(1);
    setModoCriar(false);
    setNovoInsumo(NOVO_INSUMO_INICIAL);
  };

  const handleSubmit = () => {
    if (!insumoSelecionado || quantidade <= 0) {
      toast.error("Selecione um insumo e informe uma quantidade válida.");
      return;
    }

    onAddInsumo(insumoSelecionado, parseFloat(quantidade));
    resetTudo();
    onClose();
  };

  const handleCriarInsumo = async () => {
    if (!novoInsumo.nome || !novoInsumo.custo_compra || !novoInsumo.fator_conversao) {
      toast.error("Preencha nome, custo do pacote e o fator de conversão.");
      return;
    }

    setCriando(true);
    try {
      const criado = await onCreateInsumo(novoInsumo);
      toast.success(`Insumo "${criado.nome}" criado!`);
      setSelectedInsumoId(String(criado.id));
      setModoCriar(false);
      setNovoInsumo(NOVO_INSUMO_INICIAL);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao criar insumo.");
    } finally {
      setCriando(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 animate-fadeIn">
      <div className="min-h-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-lifted w-full max-w-lg animate-slideUp">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Wheat className="w-5 h-5 text-brand-600" />
              </span>
              <h2 className="text-xl font-bold font-display">
                {modoCriar ? "Criar Novo Insumo" : "Adicionar Insumo à Ficha"}
              </h2>
            </div>
            <button onClick={() => { resetTudo(); onClose(); }} className="text-stone-400 hover:text-stone-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {modoCriar ? (
            <div>
              <p className="text-sm text-stone-500 mb-4">
                Cadastre rapidinho um insumo novo direto por aqui. Depois, se quiser, dá pra completar mais detalhes na tela de Insumos.
              </p>
              <div className="space-y-4">
                <Field label="Nome do Insumo">
                  <input
                    type="text"
                    placeholder="Ex: Chocolate em pó"
                    value={novoInsumo.nome}
                    onChange={(e) => setNovoInsumo((prev) => ({ ...prev, nome: e.target.value }))}
                    className={inputClasses}
                    autoFocus
                  />
                </Field>
                <Field label="Unidade de Uso (na receita)">
                  <select
                    value={novoInsumo.unidade_uso}
                    onChange={(e) => setNovoInsumo((prev) => ({ ...prev, unidade_uso: e.target.value }))}
                    className={`${inputClasses} bg-white`}
                  >
                    <option value="g">Grama (g)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="unidade">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="litro">Litro (l)</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Custo (R$) do Pacote">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 5.50"
                      value={novoInsumo.custo_compra}
                      onChange={(e) => setNovoInsumo((prev) => ({ ...prev, custo_compra: e.target.value }))}
                      className={inputClasses}
                    />
                  </Field>
                  <Field label="Quantas (un. de uso) cabem?">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Ex: 1000"
                      value={novoInsumo.fator_conversao}
                      onChange={(e) => setNovoInsumo((prev) => ({ ...prev, fator_conversao: e.target.value }))}
                      className={inputClasses}
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  onClick={() => setModoCriar(false)}
                  className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCriarInsumo}
                  disabled={criando}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:bg-stone-300"
                >
                  {criando ? "Criando..." : "Criar e usar este insumo"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar insumo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClasses} pl-10`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Insumo</label>
                <select
                  value={selectedInsumoId}
                  onChange={(e) => setSelectedInsumoId(e.target.value)}
                  className={`${inputClasses} bg-white`}
                >
                  <option value="">Selecione um insumo</option>
                  {insumosFiltrados.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nome} ({insumo.unidade_uso})
                    </option>
                  ))}
                </select>
                {onCreateInsumo && (
                  <button
                    type="button"
                    onClick={() => setModoCriar(true)}
                    className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-sm font-semibold mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Não encontrou? Criar novo insumo
                  </button>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Quantidade Usada (em {insumoSelecionado?.unidade_uso || "..."})
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className={inputClasses}
                />
                <span className="text-xs text-stone-500 mt-1.5 block">
                  Ex: Se a unidade é 'g', digite 100 (para 100g).
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { resetTudo(); onClose(); }}
                  className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsumoModal;
