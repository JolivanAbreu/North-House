import React, { useState, useEffect } from 'react';
import api from '../../services/api.mjs';
import toast from 'react-hot-toast';
import { IMaskInput } from 'react-imask';
import { Store, Phone, Instagram } from 'lucide-react';
import Spinner from '../../components/Spinner.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Card, CardBody } from '../../components/ui/Card.jsx';
import { inputClasses, Field } from '../../components/ui/Input.jsx';
import useAuth from '../../hooks/useAuth.mjs';

const PerfilDaLoja = () => {
  const { ehDono } = useAuth();
  const [nomeLoja, setNomeLoja] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [diasParaArquivar, setDiasParaArquivar] = useState(30);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true);
        const response = await api.get('/perfil');
        const {
          nome_loja, telefone_whatsapp, link_instagram,
          dias_para_arquivar_pedidos,
        } = response.data;

        if (nome_loja) setNomeLoja(nome_loja);
        if (telefone_whatsapp) setWhatsapp(telefone_whatsapp);
        if (link_instagram) setInstagram(link_instagram);
        if (dias_para_arquivar_pedidos) setDiasParaArquivar(dias_para_arquivar_pedidos);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toast.error("Não foi possível carregar seu perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

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
        title="Configurações da loja"
        subtitle="Contatos que saem no comprovante impresso e regras de arquivamento das comandas."
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
              <Field label="Nome da loja" help="O nome exibido no sistema e no comprovante é Casa do Norte.">
                <div className="relative">
                  <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nomeLoja}
                    onChange={(e) => setNomeLoja(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder="Casa do Norte"
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
                    placeholder="https://www.instagram.com/casadonorte"
                  />
                </div>
              </Field>

              <Field label="Arquivar comandas finalizadas após (dias)" help="Depois desse prazo, as comandas pagas saem do histórico principal, mas continuam nos relatórios.">
                <input
                  type="number"
                  min="1"
                  value={diasParaArquivar}
                  onChange={(e) => setDiasParaArquivar(e.target.value)}
                  className={inputClasses}
                />
              </Field>

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

      </fieldset>
    </div>
  );
};

export default PerfilDaLoja;
