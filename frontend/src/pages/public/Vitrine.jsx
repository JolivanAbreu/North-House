import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Search, MessageCircle, Instagram, PackageOpen, SlidersHorizontal, Clock } from "lucide-react";
import api, { BASE_URL } from "../../services/api.mjs";
import useCart from "../../hooks/useCart.mjs";
import toast from "react-hot-toast";
import { ProductCardSkeleton } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { formatCurrency, buildWhatsappLink } from "../../utils/format.mjs";

const ContactButton = ({ href, icon, text }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 rounded-xl shadow-soft
               text-stone-700 font-semibold transition-all duration-200
               hover:bg-stone-50 hover:shadow-card hover:-translate-y-0.5 w-full sm:w-auto"
  >
    {icon}
    <span>{text}</span>
  </a>
);

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor_preco", label: "Menor preço" },
  { value: "maior_preco", label: "Maior preço" },
  { value: "nome", label: "Nome (A-Z)" },
];

const Vitrine = () => {
  const [loja, setLoja] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("relevancia");
  const { usuarioId } = useParams();
  const { addToCart } = useCart();
  const [lojaAberta, setLojaAberta] = useState(true);
  const [motivoFechada, setMotivoFechada] = useState(null);
  const [variacoesSelecionadas, setVariacoesSelecionadas] = useState({});

  useEffect(() => {
    const fetchVitrine = async () => {
      try {
        setLoading(true);
        setSelectedCategory(null);
        const response = await api.get(`/public/vitrine/${usuarioId}`);
        setLoja(response.data.loja);
        setProdutos(response.data.produtos);
        setCategorias(response.data.categorias);
        setLojaAberta(response.data.lojaAberta !== false);
        setMotivoFechada(response.data.motivoFechada || null);
      } catch (error) {
        console.error("Erro ao buscar vitrine:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVitrine();
  }, [usuarioId]);

  const handleAddToCart = (produto) => {
    if (!lojaAberta) {
      toast.error(motivoFechada || "A loja está fechada no momento.");
      return;
    }
    const variacaoId = variacoesSelecionadas[produto.id];
    const variacao = variacaoId
      ? produto.VariacaoProdutos?.find((v) => v.id === Number(variacaoId))
      : null;
    addToCart(produto, variacao);
    toast.success(`${produto.nome} foi adicionado ao carrinho!`);
  };

  const filteredProducts = useMemo(() => {
    let lista = produtos;

    if (selectedCategory !== null) {
      lista = lista.filter((produto) => produto.CategoriaId === selectedCategory);
    }

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(termo) ||
          (produto.descricao || "").toLowerCase().includes(termo)
      );
    }

    const listaOrdenada = [...lista];
    if (ordenacao === "menor_preco") {
      listaOrdenada.sort((a, b) => parseFloat(a.preco_venda) - parseFloat(b.preco_venda));
    } else if (ordenacao === "maior_preco") {
      listaOrdenada.sort((a, b) => parseFloat(b.preco_venda) - parseFloat(a.preco_venda));
    } else if (ordenacao === "nome") {
      listaOrdenada.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return listaOrdenada;
  }, [produtos, selectedCategory, busca, ordenacao]);

  const getButtonClass = (catId) => {
    const baseClass =
      "px-4 py-2 rounded-full font-semibold transition-all duration-200 text-sm whitespace-nowrap flex-1 sm:flex-none text-center";
    if (selectedCategory === catId)
      return `${baseClass} bg-brand-600 text-white shadow-soft`;
    return `${baseClass} bg-white text-stone-600 border border-stone-200 hover:bg-stone-50`;
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-0">
        <div className="h-10 w-64 bg-stone-200/80 rounded-lg animate-pulse mx-auto mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="w-full px-4 sm:px-0">
        <EmptyState
          icon={PackageOpen}
          title="Loja não encontrada"
          description="Verifique se o link da vitrine está correto."
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn w-full px-4 sm:px-0">
      <div className="text-center mb-10 w-full break-words">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-stone-900">
          {loja.nome_loja}
        </h1>
        <p className="text-stone-500 mt-2">
          {produtos.length} {produtos.length === 1 ? "produto disponível" : "produtos disponíveis"}
        </p>
      </div>

      {!lojaAberta && (
        <div className="max-w-3xl mx-auto mb-8 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
          <Clock className="w-5 h-5 shrink-0" />
          <span>{motivoFechada || "A loja está fechada no momento. Você pode navegar, mas não é possível finalizar pedidos agora."}</span>
        </div>
      )}

      {/* Busca e ordenação */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-3xl mx-auto w-full">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-sm"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <SlidersHorizontal className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white appearance-none
                       focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros de Categoria */}
      {categorias.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10 w-full overflow-hidden">
          <button onClick={() => setSelectedCategory(null)} className={getButtonClass(null)}>
            Todos
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => setSelectedCategory(categoria.id)}
              className={getButtonClass(categoria.id)}
            >
              {categoria.nome}
            </button>
          ))}
        </div>
      )}

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
        {filteredProducts.map((produto, idx) => (
          <div
            key={produto.id}
            style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
            className="bg-white rounded-2xl shadow-card border border-stone-100 overflow-hidden flex flex-col
                       transition-all duration-300 ease-out hover:shadow-lifted hover:-translate-y-1 animate-slideUp w-full min-w-0"
          >
            {produto.imagem_url ? (
              <img
                src={`${BASE_URL}${produto.imagem_url}`}
                alt={produto.nome}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-48 bg-brand-50 flex items-center justify-center text-brand-300">
                <PackageOpen className="w-10 h-10" strokeWidth={1.5} />
              </div>
            )}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
              <div className="min-w-0">
                <h2 className="text-lg font-bold font-display text-stone-900 mb-1 truncate">{produto.nome}</h2>
                <p className="text-stone-500 text-sm mb-4 line-clamp-2 break-words">
                  {produto.descricao || "Produto sem descrição."}
                </p>
              </div>
              
              <div className="mt-auto w-full min-w-0">
                {produto.VariacaoProdutos?.length > 0 && (
                  <select
                    value={variacoesSelecionadas[produto.id] || ""}
                    onChange={(e) =>
                      setVariacoesSelecionadas((prev) => ({ ...prev, [produto.id]: e.target.value }))
                    }
                    className="w-full mb-3 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-400 truncate"
                  >
                    <option value="">Padrão</option>
                    {produto.VariacaoProdutos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome}{Number(v.ajuste_preco) !== 0 ? ` (${Number(v.ajuste_preco) > 0 ? "+" : ""}${formatCurrency(v.ajuste_preco)})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xl font-bold text-brand-700 truncate">
                    {formatCurrency(
                      Number(produto.preco_venda) +
                        Number(
                          produto.VariacaoProdutos?.find(
                            (v) => v.id === Number(variacoesSelecionadas[produto.id])
                          )?.ajuste_preco || 0
                        )
                    )}
                  </span>
                  <button
                    onClick={() => handleAddToCart(produto)}
                    disabled={!lojaAberta}
                    className="bg-brand-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-brand-700
                               transition-colors duration-200 text-sm shadow-soft active:scale-95 shrink-0
                               disabled:bg-stone-300 disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Search}
              title="Nenhum produto encontrado"
              description="Tente buscar por outro termo ou selecionar outra categoria."
            />
          </div>
        )}
      </div>

      {/* Rodapé de Contato */}
      {loja && (loja.telefone_whatsapp || loja.link_instagram) && (
        <div className="mt-20 pt-10 border-t border-stone-200 text-center w-full">
          <h3 className="text-xl font-bold font-display text-stone-800 mb-2">
            Fale com a gente!
          </h3>
          <p className="text-stone-500 mb-6">
            Dúvidas ou pedidos especiais? Entre em contato.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
            {loja.telefone_whatsapp && (
              <ContactButton
                href={buildWhatsappLink(loja.telefone_whatsapp, `Olá! Vim da vitrine da ${loja.nome_loja}.`)}
                icon={<MessageCircle className="w-5 h-5 text-emerald-600" />}
                text="WhatsApp"
              />
            )}
            {loja.link_instagram && (
              <ContactButton
                href={loja.link_instagram}
                icon={<Instagram className="w-5 h-5 text-brand-600" />}
                text="Instagram"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vitrine;