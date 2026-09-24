import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Mail, Lock, User } from "lucide-react";
import api from "../../services/api.mjs";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { inputClasses, Field } from "../../components/ui/Input.jsx";
import { formatDate } from "../../utils/format.mjs";

const ESTADO_INICIAL = { nome: "", email: "", senha: "" };

const Equipe = () => {
  const [atendentes, setAtendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [paraRemover, setParaRemover] = useState(null);

  const fetchEquipe = async () => {
    try {
      setLoading(true);
      const response = await api.get("/equipe");
      setAtendentes(response.data);
    } catch (error) {
      console.error("Erro ao buscar equipe:", error);
      toast.error(error.response?.data?.message || "Erro ao buscar equipe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.post("/equipe", form);
      toast.success("Atendente cadastrado com sucesso!");
      setForm(ESTADO_INICIAL);
      fetchEquipe();
    } catch (error) {
      console.error("Erro ao cadastrar atendente:", error);
      toast.error(error.response?.data?.message || "Erro ao cadastrar atendente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarRemocao = async () => {
    if (!paraRemover) return;
    try {
      await api.delete(`/equipe/${paraRemover.id}`);
      toast.success("Atendente removido.");
      setAtendentes((prev) => prev.filter((a) => a.id !== paraRemover.id));
    } catch (error) {
      console.error("Erro ao remover atendente:", error);
      toast.error("Erro ao remover atendente.");
    } finally {
      setParaRemover(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Equipe" subtitle="Dê acesso ao painel para outras pessoas ajudarem a atender os pedidos." />

      <Card className="mb-8">
        <CardHeader title="Novo Atendente" />
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nome">
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
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
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    className={`${inputClasses} pl-10`}
                    minLength={6}
                    required
                  />
                </div>
              </Field>
            </div>
            <div className="mt-6 text-right">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-soft disabled:bg-stone-300"
              >
                <Plus className="w-4 h-4" /> {salvando ? "Salvando..." : "Adicionar Atendente"}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Atendentes com acesso" />
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-stone-100 rounded-lg animate-pulse" />)}
            </div>
          ) : atendentes.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum atendente ainda" description="Cadastre acima quem mais vai gerenciar os pedidos com você." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Desde</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {atendentes.map((atendente) => (
                    <tr key={atendente.id} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="p-3 font-medium text-stone-800">{atendente.nome}</td>
                      <td className="p-3 text-stone-600">{atendente.email}</td>
                      <td className="p-3 text-stone-500">{formatDate(atendente.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex justify-end">
                          <button onClick={() => setParaRemover(atendente)} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmationModal
        show={paraRemover !== null}
        onClose={() => setParaRemover(null)}
        onConfirm={handleConfirmarRemocao}
        title="Remover atendente"
        message={`Tem certeza que deseja remover o acesso de "${paraRemover?.nome}"?`}
      />
    </div>
  );
};

export default Equipe;
