import React, { useState, useEffect } from "react";
import { Boxes, Pencil, Trash2, PackagePlus, X, AlertTriangle } from "lucide-react";
import api from "../../services/api.mjs";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import AddStockModal from "../../components/AddStockModal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { inputClasses, Field } from "../../components/ui/Input.jsx";

// Unidades "pequenas" (grama/mililitro) dão um custo por unidade minúsculo
// (ex: R$ 0,0005/g), o que é matematicamente certo mas ilegível. Nesses
// casos mostramos o custo a cada 100 unidades, que é uma referência bem
// mais fácil de ler no dia a dia (ex: R$ 0,05 / 100g).
const UNIDADES_PEQUENAS = ["g", "ml"];

const calcularCustoUnitario = (insumo) => {
  const custo = parseFloat(insumo.custo_compra);
  const fator = parseFloat(insumo.fator_conversao);
  if (isNaN(custo) || isNaN(fator) || fator === 0) return "N/A";

  const custoPorUnidade = custo / fator;
  const usaReferenciaDe100 = UNIDADES_PEQUENAS.includes(insumo.unidade_uso);
  const valorExibido = usaReferenciaDe100 ? custoPorUnidade * 100 : custoPorUnidade;

  const formatado = valorExibido.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const referencia = usaReferenciaDe100 ? `100${insumo.unidade_uso}` : insumo.unidade_uso;
  return `${formatado} / ${referencia}`;
};

const GerenciarInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [unidadeUso, setUnidadeUso] = useState("g");
  const [unidadeCompra, setUnidadeCompra] = useState("");
  const [custoCompra, setCustoCompra] = useState("");
  const [fatorConversao, setFatorConversao] = useState("");

  const [insumoParaDeletar, setInsumoParaDeletar] = useState(null);
  const [insumoStock, setInsumoStock] = useState(null);

  const fetchInsumos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/insumos");
      setInsumos(response.data);
    } catch {
      toast.error("Erro ao buscar insumos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const resetForm = () => {
    setNome("");
    setUnidadeUso("g");
    setUnidadeCompra("");
    setCustoCompra("");
    setFatorConversao("");
    setEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      nome,
      unidade_uso: unidadeUso,
      unidade_compra: unidadeCompra,
      custo_compra: custoCompra,
      fator_conversao: fatorConversao,
    };

    try {
      if (editando) {
        await api.put(`/insumos/${editando}`, data);
        toast.success("Insumo atualizado!");
      } else {
        await api.post("/insumos", data);
        toast.success("Insumo criado!");
      }
      resetForm();
      fetchInsumos();
    } catch {
      toast.error("Erro ao salvar. Verifique os dados.");
    }
  };

  const handleConfirmAddStock = async (quantidade_adicionada) => {
    if (!insumoStock) return;
    try {
      await api.post(`/insumos/${insumoStock.id}/estoque`, { quantidade_adicionada });
      toast.success("Estoque atualizado!");
      fetchInsumos();
    } catch {
      toast.error("Erro ao adicionar estoque.");
    } finally {
      setInsumoStock(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!insumoParaDeletar) return;
    try {
      await api.delete(`/insumos/${insumoParaDeletar.id}`);
      toast.success("Insumo deletado!");
      fetchInsumos();
    } catch {
      toast.error("Erro ao deletar insumo.");
    } finally {
      setInsumoParaDeletar(null);
    }
  };

  const handleEdit = (insumo) => {
    setEditando(insumo.id);
    setNome(insumo.nome);
    setUnidadeUso(insumo.unidade_uso);
    setUnidadeCompra(insumo.unidade_compra);
    setCustoCompra(insumo.custo_compra);
    setFatorConversao(insumo.fator_conversao);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Insumos e Custos" subtitle="Controle os ingredientes/materiais e seus custos" />

      <Card className="mb-8">
        <CardHeader title={editando ? "Editar Insumo" : "Novo Insumo"} />
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Field label="Nome do Insumo">
                <input
                  type="text"
                  placeholder="Ex: Farinha de Trigo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClasses}
                  required
                />
              </Field>
            </div>

            <div className="mb-4">
              <Field label="Unidade de Uso (na Receita)" help="Esta é a unidade que você usará na Ficha Técnica (ex: 100g).">
                <select
                  value={unidadeUso}
                  onChange={(e) => setUnidadeUso(e.target.value)}
                  className={`${inputClasses} bg-white`}
                >
                  <option value="g">Grama (g)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="unidade">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="litro">Litro (l)</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Pacote de Compra">
                <input
                  type="text"
                  placeholder="Ex: Saco 1kg"
                  value={unidadeCompra}
                  onChange={(e) => setUnidadeCompra(e.target.value)}
                  className={inputClasses}
                />
              </Field>
              <Field label="Custo (R$) do Pacote">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5.50"
                  value={custoCompra}
                  onChange={(e) => setCustoCompra(e.target.value)}
                  className={inputClasses}
                  required
                />
              </Field>
              <Field label="Quantas (un. de uso) cabem?">
                <input
                  type="number"
                  step="0.001"
                  placeholder="Ex: 1000"
                  value={fatorConversao}
                  onChange={(e) => setFatorConversao(e.target.value)}
                  className={inputClasses}
                  required
                />
              </Field>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Ex: Se 'Unidade de Uso' é <strong>g</strong> e você compra um <strong>Saco 1kg</strong>, o fator de conversão é <strong>1000</strong>.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              {editando && (
                <button type="button" onClick={resetForm} className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-stone-200 transition-colors">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              )}
              <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft">
                {editando ? "Atualizar" : "Salvar Insumo"}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Meus Insumos" />
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-stone-100 rounded-lg animate-pulse" />)}
            </div>
          ) : insumos.length === 0 ? (
            <EmptyState icon={Boxes} title="Nenhum insumo cadastrado" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Custo Unitário</th>
                    <th className="text-left p-3">Estoque</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((insumo) => {
                    const estoqueBaixo = parseFloat(insumo.quantidade_em_estoque) < insumo.fator_conversao * 0.1;
                    return (
                      <tr key={insumo.id} className={`border-b border-stone-50 ${estoqueBaixo ? "bg-rose-50/60" : "hover:bg-stone-50"}`}>
                        <td className="p-3 font-medium text-stone-800">{insumo.nome}</td>
                        <td className="p-3 text-stone-600">{calcularCustoUnitario(insumo)}</td>
                        <td className={`p-3 font-medium ${estoqueBaixo ? "text-rose-700" : "text-stone-700"}`}>
                          <span className="flex items-center gap-1.5">
                            {estoqueBaixo && <AlertTriangle className="w-3.5 h-3.5" />}
                            {parseFloat(insumo.quantidade_em_estoque).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} {insumo.unidade_uso}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setInsumoStock(insumo)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Adicionar estoque">
                              <PackagePlus className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(insumo)} className="p-2 text-stone-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setInsumoParaDeletar(insumo)} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Deletar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmationModal
        show={insumoParaDeletar !== null}
        onClose={() => setInsumoParaDeletar(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o insumo "${insumoParaDeletar?.nome}"?`}
      />

      <AddStockModal
        show={insumoStock !== null}
        onClose={() => setInsumoStock(null)}
        onConfirm={handleConfirmAddStock}
        insumo={insumoStock}
      />
    </div>
  );
};

export default GerenciarInsumos;
