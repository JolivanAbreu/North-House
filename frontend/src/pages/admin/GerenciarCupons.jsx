import React, { useState, useEffect } from "react";
import { Ticket, Pencil, Trash2, X, Percent, DollarSign } from "lucide-react";
import api from "../../services/api.mjs";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { inputClasses, Field } from "../../components/ui/Input.jsx";
import { formatCurrency, formatDate } from "../../utils/format.mjs";

const ESTADO_INICIAL = {
  codigo: "",
  tipo: "percentual",
  valor: "",
  validade: "",
  usos_max: "",
  pedido_minimo: "",
  ativo: true,
};

const GerenciarCupons = () => {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [cupomParaDeletar, setCupomParaDeletar] = useState(null);

  const fetchCupons = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cupons");
      setCupons(response.data);
    } catch {
      toast.error("Erro ao buscar cupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCupons();
  }, []);

  const resetForm = () => {
    setForm(ESTADO_INICIAL);
    setEditandoId(null);
  };

  const handleChange = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.codigo || !form.valor) {
      toast.error("Código e valor são obrigatórios.");
      return;
    }

    const payload = {
      codigo: form.codigo,
      tipo: form.tipo,
      valor: form.valor,
      validade: form.validade || null,
      usos_max: form.usos_max || null,
      pedido_minimo: form.pedido_minimo || 0,
      ativo: form.ativo,
    };

    try {
      if (editandoId) {
        await api.put(`/cupons/${editandoId}`, payload);
        toast.success("Cupom atualizado!");
      } else {
        await api.post("/cupons", payload);
        toast.success("Cupom criado!");
      }
      resetForm();
      fetchCupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar cupom.");
    }
  };

  const handleEdit = (cupom) => {
    setEditandoId(cupom.id);
    setForm({
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: cupom.valor,
      validade: cupom.validade ? cupom.validade.substring(0, 10) : "",
      usos_max: cupom.usos_max || "",
      pedido_minimo: cupom.pedido_minimo || "",
      ativo: cupom.ativo,
    });
  };

  const handleToggleAtivo = async (cupom) => {
    try {
      await api.put(`/cupons/${cupom.id}`, { ativo: !cupom.ativo });
      fetchCupons();
    } catch {
      toast.error("Erro ao atualizar cupom.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!cupomParaDeletar) return;
    try {
      await api.delete(`/cupons/${cupomParaDeletar.id}`);
      toast.success("Cupom deletado!");
      fetchCupons();
    } catch {
      toast.error("Erro ao deletar cupom.");
    } finally {
      setCupomParaDeletar(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Cupons de Desconto" subtitle="Crie cupons para incentivar novas compras" />

      <Card className="mb-8">
        <CardHeader title={editandoId ? "Editar Cupom" : "Novo Cupom"} />
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Código" hint="ex: BEMVINDO10">
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value.toUpperCase())}
                  className={inputClasses}
                  placeholder="BEMVINDO10"
                  required
                />
              </Field>
              <Field label="Tipo de desconto">
                <select
                  value={form.tipo}
                  onChange={(e) => handleChange("tipo", e.target.value)}
                  className={`${inputClasses} bg-white`}
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="fixo">Valor fixo (R$)</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label={form.tipo === "percentual" ? "Valor (%)" : "Valor (R$)"}>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  className={inputClasses}
                  placeholder={form.tipo === "percentual" ? "10" : "15.00"}
                  required
                />
              </Field>
              <Field label="Pedido mínimo (R$)" hint="opcional">
                <input
                  type="number"
                  step="0.01"
                  value={form.pedido_minimo}
                  onChange={(e) => handleChange("pedido_minimo", e.target.value)}
                  className={inputClasses}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Limite de usos" hint="opcional">
                <input
                  type="number"
                  value={form.usos_max}
                  onChange={(e) => handleChange("usos_max", e.target.value)}
                  className={inputClasses}
                  placeholder="Ilimitado"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Field label="Válido até" hint="opcional">
                <input
                  type="date"
                  value={form.validade}
                  onChange={(e) => handleChange("validade", e.target.value)}
                  className={inputClasses}
                />
              </Field>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => handleChange("ativo", e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-brand-600 focus:ring-brand-400"
                  />
                  Cupom ativo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {editandoId && (
                <button type="button" onClick={resetForm} className="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-stone-200 transition-colors">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              )}
              <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft">
                {editandoId ? "Atualizar" : "Criar Cupom"}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Meus Cupons" />
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-stone-100 rounded-lg animate-pulse" />)}
            </div>
          ) : cupons.length === 0 ? (
            <EmptyState icon={Ticket} title="Nenhum cupom criado" description="Crie seu primeiro cupom de desconto acima." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="text-left p-3">Código</th>
                    <th className="text-left p-3">Desconto</th>
                    <th className="text-left p-3">Usos</th>
                    <th className="text-left p-3">Validade</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cupons.map((cupom) => (
                    <tr key={cupom.id} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="p-3 font-mono font-semibold text-stone-800">{cupom.codigo}</td>
                      <td className="p-3 text-stone-600">
                        <span className="flex items-center gap-1">
                          {cupom.tipo === "percentual" ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                          {cupom.tipo === "percentual" ? `${parseFloat(cupom.valor)}%` : formatCurrency(cupom.valor)}
                        </span>
                      </td>
                      <td className="p-3 text-stone-500">
                        {cupom.usos_atual}{cupom.usos_max ? ` / ${cupom.usos_max}` : ""}
                      </td>
                      <td className="p-3 text-stone-500">{cupom.validade ? formatDate(cupom.validade) : "Sem prazo"}</td>
                      <td className="p-3">
                        <button onClick={() => handleToggleAtivo(cupom)}>
                          <Badge color={cupom.ativo ? "emerald" : "stone"}>{cupom.ativo ? "Ativo" : "Inativo"}</Badge>
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(cupom)} className="p-2 text-stone-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setCupomParaDeletar(cupom)} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
        show={cupomParaDeletar !== null}
        onClose={() => setCupomParaDeletar(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o cupom "${cupomParaDeletar?.codigo}"?`}
      />
    </div>
  );
};

export default GerenciarCupons;
