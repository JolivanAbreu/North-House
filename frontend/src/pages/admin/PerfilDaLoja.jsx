import React, { useState, useEffect } from 'react';
import api from '../../services/api.mjs';
import toast from 'react-hot-toast';
import { IMaskInput } from 'react-imask';
import { Store, Phone, Instagram, Clock, Archive, PauseCircle, PlayCircle } from 'lucide-react';
import Spinner from '../../components/Spinner.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx';
import { inputClasses, Field } from '../../components/ui/Input.jsx';
import useAuth from '../../hooks/useAuth.mjs';

const DIAS = [
  { chave: 'dom', label: 'Domingo' },
  { chave: 'seg', label: 'Segunda' },
  { chave: 'ter', label: 'Terça' },
  { chave: 'qua', label: 'Quarta' },
  { chave: 'qui', label: 'Quinta' },
  { chave: 'sex', label: 'Sexta' },
  { chave: 'sab', label: 'Sábado' },
];

const horariosPadrao = () => {
  const obj = {};
  DIAS.forEach(({ chave }) => {
    obj[chave] = { ativo: chave !== 'dom', abre: '08:00', fecha: '18:00' };
  });
  return obj;
};

const PerfilDaLoja = () => {
  const { ehDono } = useAuth();
  const [nomeLoja, setNomeLoja] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [diasParaArquivar, setDiasParaArquivar] = useState(30);
  const [horarios, setHorarios] = useState(horariosPadrao());
  const [lojaPausada, setLojaPausada] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true);
        const response = await api.get('/perfil');
        const {
          nome_loja, telefone_whatsapp, link_instagram,
          dias_para_arquivar_pedidos, horarios_funcionamento, loja_pausada,
        } = response.data;

        if (nome_loja) setNomeLoja(nome_loja);
        if (telefone_whatsapp) setWhatsapp(telefone_whatsapp);
        if (link_instagram) setInstagram(link_instagram);
        if (dias_para_arquivar_pedidos) setDiasParaArquivar(dias_para_arquivar_pedidos);
        if (horarios_funcionamento) setHorarios(horarios_funcionamento);
        setLojaPausada(Boolean(loja_pausada));
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toast.error("Não foi possível carregar seu perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

  const atualizarDia = (chave, campo, valor) => {
    setHorarios((prev) => ({
      ...prev,
      [chave]: { ...prev[chave], [campo]: valor },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const telefoneLimpo = whatsapp.replace(/\D/g, '');

    if (telefoneLimpo && telefoneLimpo.length !== 13) {
      toast.error("Telefone inválido. Inclua o 55 (Brasil) e o DDD. Ex: 55 85 99999-8888");
      setSaving(false);
      return;
    }

    try {
      await api.put('/perfil', {
        nome_loja: nomeLoja,
        telefone_whatsapp: telefoneLimpo,
        link_instagram: instagram,
        dias_para_arquivar_pedidos: diasParaArquivar,
        horarios_funcionamento: JSON.stringify(horarios),
        loja_pausada: lojaPausada,
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error(error.response?.data?.message || "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="12" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <PageHeader
        title="Perfil da Loja"
        subtitle="Estas informações aparecem publicamente na vitrine e na página de status do pedido."
      />

      {!ehDono && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          Apenas o dono da loja pode alterar essas configurações. Você pode visualizar, mas não salvar.
        </div>
      )}

      <fieldset disabled={!ehDono} className="space-y-6 disabled:opacity-70">
        <Card>
          <CardBody className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Nome da Loja">
                <div className="relative">
                  <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nomeLoja}
                    onChange={(e) => setNomeLoja(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder="Ex: Doceria da Maria"
                  />
                </div>
              </Field>

              <Field label="WhatsApp (com código do país)" help="Formato: 55 (Brasil) + DDD + número.">
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                  <IMaskInput
                    mask="00 (00) 00000-0000"
                    value={whatsapp}
                    onAccept={(value) => setWhatsapp(value)}
                    placeholder="55 (85) 99999-8888"
                    className={`${inputClasses} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Link do Instagram">
                <div className="relative">
                  <Instagram className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder="https://www.instagram.com/seunegocio"
                  />
                </div>
              </Field>

              <Field label="Arquivar pedidos concluídos/cancelados após (dias)" help="Depois desse prazo, esses pedidos somem da tela principal e ficam na aba Arquivados.">
                <input
                  type="number"
                  min="1"
                  value={diasParaArquivar}
                  onChange={(e) => setDiasParaArquivar(e.target.value)}
                  className={inputClasses}
                />
              </Field>

              <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-xl">
                <div className="flex items-start gap-3">
                  {lojaPausada ? <PauseCircle className="w-5 h-5 text-rose-500 mt-0.5" /> : <PlayCircle className="w-5 h-5 text-emerald-500 mt-0.5" />}
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Pausar loja agora</p>
                    <p className="text-xs text-stone-500 mt-0.5">Fecha a vitrine para novos pedidos imediatamente, independente do horário configurado abaixo.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLojaPausada((v) => !v)}
                  className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${lojaPausada ? "bg-rose-500" : "bg-stone-300"}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${lojaPausada ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="text-right pt-2">
                <button
                  type="submit"
                  disabled={saving || !ehDono}
                  className="bg-brand-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-soft disabled:bg-stone-300"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Horário de funcionamento" subtitle={<span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Fora desses horários, a vitrine fica visível mas não aceita novos pedidos.</span>} />
          <CardBody>
            <div className="space-y-2">
              {DIAS.map(({ chave, label }) => (
                <div key={chave} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50">
                  <label className="flex items-center gap-2 w-32 shrink-0 text-sm font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={horarios[chave]?.ativo ?? false}
                      onChange={(e) => atualizarDia(chave, 'ativo', e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    {label}
                  </label>
                  {horarios[chave]?.ativo ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={horarios[chave]?.abre || '08:00'}
                        onChange={(e) => atualizarDia(chave, 'abre', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                      />
                      <span className="text-stone-400">até</span>
                      <input
                        type="time"
                        value={horarios[chave]?.fecha || '18:00'}
                        onChange={(e) => atualizarDia(chave, 'fecha', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">Fechado</span>
                  )}
                </div>
              ))}
            </div>
            {ehDono && (
              <div className="text-right pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-stone-800 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-stone-900 transition-colors disabled:bg-stone-300 inline-flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Horários'}
                </button>
              </div>
            )}
          </CardBody>
        </Card>
      </fieldset>
    </div>
  );
};

export default PerfilDaLoja;
