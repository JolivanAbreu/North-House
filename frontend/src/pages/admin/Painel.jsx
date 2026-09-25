import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Menu, X, LayoutDashboard, ClipboardList, Tags, Store, LogOut,
  FileBarChart, Users, UserCog, ShoppingBag, ChevronDown, UtensilsCrossed,
  ShoppingBasket, MoreHorizontal,
} from "lucide-react";
import useAuth from "../../hooks/useAuth.mjs";
import Logo from "../../components/Logo.jsx";
import { BRAND } from "../../config/brand.mjs";

// Abas principais do dia a dia do restaurante
const NAV_ITEMS = [
  { to: "/admin", label: "Comandas", icon: ShoppingBag, end: true },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/mercearia", label: "Mercearia", icon: ShoppingBasket },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
];

// Telas de apoio, agrupadas no menu "Mais"
const NAV_ITEMS_MAIS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Histórico de pedidos", icon: ClipboardList },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
];

/** Fecha um painel (dropdown/menu) ao clicar fora ou pressionar Esc. */
function useDismiss(onDismiss) {
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onDismiss]);
  return ref;
}

// Relógio simples na navbar: ajuda o garçom a conferir o horário das comandas.
const Relogio = () => {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden xl:inline text-xs font-semibold text-stone-400 tabular-nums px-2">
      {agora.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} ·{" "}
      {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
};

const Painel = () => {
  const { logout, usuario, ehDono } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMaisOpen, setIsMaisOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const maisRef = useDismiss(() => setIsMaisOpen(false));
  const userRef = useDismiss(() => setIsUserOpen(false));

  const closeAll = () => {
    setIsMobileOpen(false);
    setIsMaisOpen(false);
    setIsUserOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `relative flex items-center gap-1.5 h-16 px-3 text-[13.5px] font-medium tracking-tight transition-colors border-b-2 ${
      isActive
        ? "text-stone-900 border-brand-600"
        : "text-stone-500 border-transparent hover:text-stone-900 hover:border-stone-300"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-brand-50 text-brand-800" : "text-stone-600 hover:bg-stone-100"
    }`;

  const initials = (usuario?.nome || usuario?.email || "CN").trim().charAt(0).toUpperCase();
  const isMaisRouteActive = NAV_ITEMS_MAIS.some((item) => location.pathname.startsWith(item.to));

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 print:hidden">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Marca */}
            <NavLink to="/admin" end className="flex items-center gap-2.5 shrink-0" onClick={closeAll}>
              <Logo size="sm" />
              <span className="hidden sm:flex flex-col leading-none">
                <span className="font-bold font-display text-[17px] tracking-tight text-stone-900">{BRAND.nome}</span>
                <span className="text-[10.5px] font-medium text-stone-400 mt-0.5">{BRAND.descricao}</span>
              </span>
            </NavLink>

            {/* Navegação principal (desktop) */}
            <nav className="hidden lg:flex items-stretch">
              {NAV_ITEMS.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                  {label}
                </NavLink>
              ))}

              {/* Dropdown "Mais" */}
              <div className="relative" ref={maisRef}>
                <button
                  onClick={() => setIsMaisOpen((v) => !v)}
                  className={`flex items-center gap-1 h-16 px-3 text-[13.5px] font-medium tracking-tight transition-colors border-b-2 ${
                    isMaisOpen || isMaisRouteActive
                      ? "text-stone-900 border-brand-600"
                      : "text-stone-500 border-transparent hover:text-stone-900 hover:border-stone-300"
                  }`}
                >
                  Mais
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMaisOpen ? "rotate-180" : ""}`} />
                </button>
                {isMaisOpen && (
                  <div className="absolute left-0 top-full mt-1 w-60 py-1.5 bg-white rounded-lg border border-stone-200 shadow-lifted animate-fadeIn">
                    {NAV_ITEMS_MAIS.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setIsMaisOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                            isActive ? "text-brand-700 font-semibold bg-brand-50" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                          }`
                        }
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Ações à direita */}
            <div className="flex items-center gap-1 shrink-0">
              <Relogio />

              {/* Menu do usuário (desktop) */}
              <div className="relative hidden md:block" ref={userRef}>
                <button
                  onClick={() => setIsUserOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-md hover:bg-stone-100 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                    {initials}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isUserOpen ? "rotate-180" : ""}`} />
                </button>
                {isUserOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 py-1.5 bg-white rounded-lg border border-stone-200 shadow-lifted animate-fadeIn">
                    <p className="px-3.5 py-2 text-xs text-stone-400 truncate border-b border-stone-100 mb-1">
                      {usuario?.email}
                    </p>
                    {ehDono && (
                      <NavLink
                        to="/admin/equipe"
                        onClick={() => setIsUserOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                        Equipe
                      </NavLink>
                    )}
                    <NavLink
                      to="/admin/perfil"
                      onClick={() => setIsUserOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      Configurações da loja
                    </NavLink>
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão do menu mobile */}
              <button
                onClick={() => setIsMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Abrir menu"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin animate-fadeIn">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={closeAll} className={mobileLinkClass}>
                  <Icon className="w-4.5 h-4.5" />
                  {label}
                </NavLink>
              ))}

              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-3 mb-1 px-3">
                <MoreHorizontal className="w-3.5 h-3.5" /> Mais
              </p>
              {NAV_ITEMS_MAIS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={closeAll} className={mobileLinkClass}>
                  <Icon className="w-4.5 h-4.5" />
                  {label}
                </NavLink>
              ))}

              <div className="border-t border-stone-200 mt-3 pt-3 flex flex-col gap-0.5">
                {ehDono && (
                  <NavLink to="/admin/equipe" onClick={closeAll} className={mobileLinkClass}>
                    <UserCog className="w-4.5 h-4.5" />
                    Equipe
                  </NavLink>
                )}
                <NavLink to="/admin/perfil" onClick={closeAll} className={mobileLinkClass}>
                  <Store className="w-4.5 h-4.5" />
                  Configurações da loja
                </NavLink>
                <p className="text-xs text-stone-400 truncate px-3 pt-2">{usuario?.email}</p>
                <button
                  onClick={logout}
                  className="mt-1 flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Sair
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 w-full print:p-0">
        <div className="mx-auto max-w-[1600px] w-full px-4 md:px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Painel;
