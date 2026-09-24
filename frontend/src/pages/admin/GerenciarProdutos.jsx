import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  Pencil,
  Trash2,
  X,
  Plus,
  EyeOff,
  Eye,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.mjs";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { inputClasses, Field } from "../../components/ui/Input.jsx";
import { formatCurrency, formatPrecoUnidade } from "../../utils/format.mjs";

const GerenciarProdutos = () => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [editandoId, setEditandoId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");

  const [produtoParaDeletar, setProdutoParaDeletar] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [disponivel, setDisponivel] = useState(true);
  const [alternandoDisponibilidade, setAlternandoDisponibilidade] = useState(null);
  const [unidadeVenda, setUnidadeVenda] = useState("unidade");
  const [abaTipo, setAbaTipo] = useState("cardapio");

  // Variações (ex: tamanhos, sabores) do produto em edição
  const [variacoes, setVariacoes] = useState([]);
  const [novaVariacaoNome, setNovaVariacaoNome] = useState("");
  const [novaVariacaoAjuste, setNovaVariacaoAjuste] = useState("");
  const [salvandoVariacao, setSalvandoVariacao] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (showFormModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showFormModal]);

  const fetchProdutos = async () => {
    try {
      setLoadingList(true);
      const response = await api.get("/produtos");
      setProdutos(response.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, []);

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setCategoriaId("");
    setPrecoVenda("");
    setEditandoId(null);
    setDisponivel(true);
    setVariacoes([]);
    setNovaVariacaoNome("");
    setNovaVariacaoAjuste("");
    setUnidadeVenda("unidade");
  };

  const handleFecharModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  // Categorias e produtos filtrados pela aba ativa
  const categoriasDaAba = categorias.filter(
    (c) => (c.tipo || "cardapio") === abaTipo,
  );
  
  const produtosDaAba = produtos.filter(
    (p) => (p.Categoria?.tipo || "cardapio") === abaTipo,
  );

  const handleAbrirNovoProduto = () => {
    resetForm();
    if (categoriasDaAba.length > 0) {
      setCategoriaId(String(categoriasDaAba[0].id));
    }
    setShowFormModal(true);
  };

  const fetchVariacoes = async (produtoId) => {
    try {
      const response = await api.get(`/produtos/${produtoId}/variacoes`);
      setVariacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar variações:", error);
    }
  };

  const handleAdicionarVariacao = async () => {
    if (!editandoId || !novaVariacaoNome.trim()) return;
    setSalvandoVariacao(true);
    try {
      const response = await api.post(`/produtos/${editandoId}/variacoes`, {
        nome: novaVariacaoNome.trim(),
        ajuste_preco: novaVariacaoAjuste || 0,
      });
      setVariacoes((prev) => [...prev, response.data]);
      setNovaVariacaoNome("");
      setNovaVariacaoAjuste("");
      toast.success("Variação adicionada!");
    } catch (error) {
      console.error("Erro ao adicionar variação:", error);
      toast.error(
        error.response?.data?.message || "Erro ao adicionar variação.",
      );
    } finally {
      setSalvandoVariacao(false);
    }
  };

  const handleRemoverVariacao = async (variacaoId) => {
    try {
      await api.delete(`/produtos/variacoes/${variacaoId}`);
      setVariacoes((prev) => prev.filter((v) => v.id !== variacaoId));
    } catch (error) {
      console.error("Erro ao remover variação:", error);
      toast.error("Erro ao remover variação.");
    }
  };

  const handleToggleDisponibilidade = async (produto) => {
    setAlternandoDisponibilidade(produto.id);
    try {
      const novoValor = !produto.disponivel;
      await api.put(`/produtos/${produto.id}`, { disponivel: novoValor });
      setProdutos((prev) =>
        prev.map((p) =>
          p.id === produto.id ? { ...p, disponivel: novoValor } : p,
        ),
      );
      toast.success(
        novoValor
          ? "Produto disponível novamente."
          : "Produto pausado (some da vitrine).",
      );
    } catch (error) {
      console.error("Erro ao alternar disponibilidade:", error);
      toast.error("Erro ao atualizar disponibilidade.");
    } finally {
      setAlternandoDisponibilidade(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !categoriaId || !precoVenda) {
      toast.error("Nome, Categoria e Preço de venda são obrigatórios.");
      return;
    }

    setSalvando(true);

    const payload = {
      nome,
      descricao,
      CategoriaId: categoriaId,
      preco_venda: precoVenda,
      disponivel,
      unidade_venda: unidadeVenda
    };

    try {
      if (editandoId) {
        await api.put(`/produtos/${editandoId}`, payload);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await api.post("/produtos", payload);
        toast.success("Produto salvo com sucesso!");
      }
      handleFecharModal();
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error(error.response?.data?.message || "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!produtoParaDeletar) return;

    try {
      await api.delete(`/produtos/${produtoParaDeletar.id}`);
      toast.success("Produto deletado com sucesso!");
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      toast.error(
        "Erro ao deletar. Verifique se ele não está associado a um pedido.",
      );
    } finally {
      setProdutoParaDeletar(null);
    }
  };

  const handleEditProduto = (produto) => {
    setEditandoId(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setCategoriaId(produto.Categoria?.id || "");
    setPrecoVenda(
      produto.preco_venda != null ? String(produto.preco_venda) : "",
    );
    setDisponivel(produto.disponivel !== false);
    setUnidadeVenda(produto.unidade_venda || "unidade");
    setAbaTipo(produto.Categoria?.tipo || "cardapio");
    fetchVariacoes(produto.id);
    setShowFormModal(true);
  };

  return (
    <div className="animate-fadeIn pb-12 w-full max-w-full">
      <PageHeader
        title="Gerenciar Produtos"
        subtitle="Cadastre e edite os produtos da sua loja"
        action={
          <button
            onClick={handleAbrirNovoProduto}
            className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Novo produto
          </button>
        }
      />

      {/* Abas: Cardápio vs Mercearia */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-200 pb-3">
        <button
          onClick={() => setAbaTipo("cardapio")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            abaTipo === "cardapio"
              ? "bg-brand-600 text-white shadow-soft"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          Cardápio
        </button>
        <button
          onClick={() => setAbaTipo("mercearia")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            abaTipo === "mercearia"
              ? "bg-amber-600 text-white shadow-soft"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          Mercearia
        </button>
      </div>

      {/* Lista de Produtos */}
      <Card className="w-full">
        <CardBody className="p-4 sm:p-6 w-full">
          {loadingList ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-stone-100 rounded-2xl animate-pulse w-full"
                />
              ))}
            </div>
          ) : produtosDaAba.length === 0 ? (
            <EmptyState
              icon={Package}
              title={`Nenhum produto em ${abaTipo === "cardapio" ? "Cardápio" : "Mercearia"}`}
              description="Clique em 'Novo produto' para adicionar o primeiro item nesta seção."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
              {produtosDaAba.map((produto) => (
                <div
                  key={produto.id}
                  className={`bg-white rounded-2xl border border-stone-100 p-4 flex flex-col justify-between transition-all duration-200 shadow-card hover:shadow-lifted w-full min-w-0 ${
                    !produto.disponivel ? "opacity-60 bg-stone-50/50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
                      <h3 className="font-bold text-stone-900 text-base leading-tight truncate">
                        {produto.nome}
                      </h3>
                      <button
                        onClick={() => handleToggleDisponibilidade(produto)}
                        disabled={alternandoDisponibilidade === produto.id}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                          produto.disponivel
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                        title={produto.disponivel ? "Clique para pausar" : "Clique para ativar"}
                      >
                        {produto.disponivel ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-brand-600 mb-2 truncate">
                      {produto.Categoria?.nome || "Sem categoria"}
                    </p>
                    {produto.descricao && (
                      <p className="text-xs text-stone-500 line-clamp-2 mb-3 break-words">
                        {produto.descricao}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-auto border-t border-stone-100 flex items-center justify-between min-w-0">
                    <span className="font-bold text-stone-900 text-sm truncate">
                      {formatPrecoUnidade(
                        produto.preco_venda,
                        produto.unidade_venda,
                      )}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditProduto(produto)}
                        className="p-2 text-stone-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProdutoParaDeletar(produto)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal Formulário (Novo/Editar Produto) usando createPortal */}
      {showFormModal && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleFecharModal}
        >
          <div
            className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 w-full max-w-lg animate-slideUp relative max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold font-display text-stone-900">
                {editandoId ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={handleFecharModal}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nome do produto">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Bolo de Cenoura"
                  className={inputClasses}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Categoria">
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className={`${inputClasses} bg-white`}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriasDaAba.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Unidade de venda">
                  <select
                    value={unidadeVenda}
                    onChange={(e) => setUnidadeVenda(e.target.value)}
                    className={`${inputClasses} bg-white`}
                  >
                    <option value="unidade">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                  </select>
                </Field>
              </div>

              <Field label="Preço de venda (R$)">
                <input
                  type="number"
                  step="0.01"
                  value={precoVenda}
                  onChange={(e) => setPrecoVenda(e.target.value)}
                  placeholder="0.00"
                  className={inputClasses}
                  required
                />
              </Field>

              <Field label="Descrição (opcional)">
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ingredientes, detalhes do produto..."
                  rows={2}
                  className={inputClasses}
                />
              </Field>

              {/* Seção de Variações */}
              {editandoId && (
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-sm font-bold text-stone-800 mb-2">
                    Variações (Tamanhos, Sabores)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Ex: Grande"
                      value={novaVariacaoNome}
                      onChange={(e) => setNovaVariacaoNome(e.target.value)}
                      className={`${inputClasses} flex-1 min-w-0`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="+ R$ Ajuste"
                      value={novaVariacaoAjuste}
                      onChange={(e) => setNovaVariacaoAjuste(e.target.value)}
                      className={`${inputClasses} w-24 sm:w-28 shrink-0`}
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarVariacao}
                      disabled={salvandoVariacao}
                      className="bg-stone-800 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-stone-900 transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {variacoes.length > 0 && (
                    <ul className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {variacoes.map((v) => (
                        <li
                          key={v.id}
                          className="flex justify-between items-center text-xs bg-stone-50 p-2 rounded-lg border border-stone-100"
                        >
                          <span className="font-medium text-stone-700 truncate">
                            {v.nome}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-stone-500">
                              + {formatCurrency(v.ajuste_preco)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoverVariacao(v.id)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors shadow-soft disabled:bg-stone-300"
                >
                  {salvando ? "Salvando..." : "Salvar produto"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        show={produtoParaDeletar !== null}
        onClose={() => setProdutoParaDeletar(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o produto "${produtoParaDeletar?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </div>
  );
};

export default GerenciarProdutos;