import React, { useState, useEffect } from "react";
import { Tags, Pencil, Trash2, X } from "lucide-react";
import api from "../../services/api.mjs";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { inputClasses, Field } from "../../components/ui/Input.jsx";

const TIPOS = [
  { value: "cardapio", label: "Cardápio (restaurante)" },
  { value: "mercearia", label: "Mercearia" },
];

const GerenciarCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("cardapio");
  const [editando, setEditando] = useState(null);
  const [categoriaParaDeletar, setCategoriaParaDeletar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abaFiltro, setAbaFiltro] = useState("cardapio");

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categorias");
      setCategorias(response.data);
    } catch {
      toast.error("Erro ao buscar categorias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const resetForm = (tipoPadrao = abaFiltro) => {
    setNome("");
    setTipo(tipoPadrao);
    setEditando(null);
  };

  // O tipo da nova categoria acompanha a aba aberta (Cardápio / Mercearia),
  // para não criar sem querer uma categoria de mercearia como cardápio.
  const trocarAba = (novaAba) => {
    setAbaFiltro(novaAba);
    if (!editando) setTipo(novaAba);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { nome, tipo };

    try {
      if (editando) {
        await api.put(`/categorias/${editando}`, data);
        toast.success("Categoria atualizada!");
      } else {
        await api.post("/categorias", data);
        toast.success("Categoria criada!");
      }
      setAbaFiltro(tipo);
      resetForm(tipo);
      fetchCategorias();
    } catch {
      toast.error("Erro ao salvar categoria.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoriaParaDeletar) return;
    try {
      await api.delete(`/categorias/${categoriaParaDeletar.id}`);
      toast.success("Categoria deletada!");
      fetchCategorias();
    } catch {
      toast.error("Não foi possível deletar. Verifique se a categoria está em uso.");
    } finally {
      setCategoriaParaDeletar(null);
    }
  };

  const handleEdit = (categoria) => {
    setEditando(categoria.id);
    setNome(categoria.nome);
    setTipo(categoria.tipo || "cardapio");
  };

  const categoriasFiltradas = categorias.filter((c) => (c.tipo || "cardapio") === abaFiltro);

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Categorias de Produtos" subtitle="Organize seus produtos em categorias" />

      <Card className="mb-8">
        <CardBody className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <Field label={editando ? `Editando categoria` : "Nova categoria"}>
                <input
                  type="text"
                  placeholder="Ex: Bolos e Tortas"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClasses}
                  required
                />
              </Field>
            </div>
            <div className="sm:w-56">
              <Field label="Tipo">
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${inputClasses} bg-white`}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft">
              {editando ? "Atualizar" : "Salvar"}
            </button>
            {editando && (
              <button type="button" onClick={() => resetForm()} className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-stone-200 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Minhas Categorias"
          action={
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => trocarAba(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    abaFiltro === t.value ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        />
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />)}
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <EmptyState icon={Tags} title="Nenhuma categoria cadastrada nessa aba" description="Crie uma categoria acima." />
          ) : (
            <div className="divide-y divide-stone-100">
              {categoriasFiltradas.map((categoria) => (
                <div key={categoria.id} className="flex justify-between items-center py-3">
                  <span className="text-stone-700 font-medium">{categoria.nome}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(categoria)} className="p-2 text-stone-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCategoriaParaDeletar(categoria)} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmationModal
        show={categoriaParaDeletar !== null}
        onClose={() => setCategoriaParaDeletar(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar a categoria "${categoriaParaDeletar?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default GerenciarCategorias;
