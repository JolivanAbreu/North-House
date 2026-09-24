import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu, X, LayoutDashboard, ClipboardList, Package, Tags,
  Ticket, Store, LogOut, Bell, FileBarChart, Users, UserCog, ShoppingBag,
  ChevronDown, BellRing, BellOff,
} from "lucide-react";
import useAuth from "../../hooks/useAuth.mjs";
import useOrderNotifications from "../../hooks/useOrderNotifications.mjs";
import usePushNotifications from "../../hooks/usePushNotifications.mjs";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/admin", label: "Comandas", icon: ShoppingBag, end: true },
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
];

const NAV_ITEMS_CATALOGO = [
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/cupons", label: "Cupons", icon: Ticket },
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

const Painel = () => {
  const { logout, usuario, ehDono } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const { novosPedidos, marcarComoVisto } = useOrderNotifications();
  const { suportado, inscrito, disponivel, carregando, ativar, desativar } = usePushNotifications();
  const navigate = useNavigate();

  const catalogRef = useDismiss(() => setIsCatalogOpen(false));
  const userRef = useDismiss(() => setIsUserOpen(false));

  const handleTogglePush = async () => {
    const resultado = inscrito ? await desativar() : await ativar();
    if (resultado.ok) {
      toast.success(inscrito ? "Notificações desativadas neste dispositivo." : "Notificações ativadas neste dispositivo!");
    } else if (resultado.motivo) {
      toast.error(resultado.motivo);
    }
  };

  const handleBellClick = () => {
    marcarComoVisto();
    navigate("/admin/pedidos");
    setIsMobileOpen(false);
  };

  const closeAll = () => {
    setIsMobileOpen(false);
    setIsCatalogOpen(false);
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

  const initials = (usuario?.nomeLoja || usuario?.email || "SM").trim().charAt(0).toUpperCase();
  const isCatalogRouteActive =
    typeof window !== "undefined" &&
    NAV_ITEMS_CATALOGO.some((item) => window.location.pathname.startsWith(item.to));

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-200 print:hidden">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Marca */}
            <NavLink to="/admin" end className="flex items-center gap-2 shrink-0" onClick={closeAll}>
              <span className="w-8 h-8 rounded-md bg-stone-900 flex items-center justify-center">
                <Store className="w-4 h-4 text-brand-400" strokeWidth={2.25} />
              </span>
              <span className="font-bold font-display text-[17px] tracking-tight text-stone-900 hidden sm:inline">
                SGV MEI
              </span>
            </NavLink>

            {/* Navegação principal (desktop) */}
            <nav className="hidden lg:flex items-stretch">
              {NAV_ITEMS.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                  {label}
                  {label === "Pedidos" && novosPedidos > 0 && (
                    <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-brand-600 text-white text-[10px] font-bold rounded-full">
                      {novosPedidos}
                    </span>
                  )}
                </NavLink>
              ))}

              {/* Dropdown Catálogo */}
              <div className="relative" ref={catalogRef}>
                <button
                  onClick={() => setIsCatalogOpen((v) => !v)}
                  className={`flex items-center gap-1 h-16 px-3 text-[13.5px] font-medium tracking-tight transition-colors border-b-2 ${
                    isCatalogOpen || isCatalogRouteActive
                      ? "text-stone-900 border-brand-600"
                      : "text-stone-500 border-transparent hover:text-stone-900 hover:border-stone-300"
                  }`}
                >
                  Catálogo
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatalogOpen ? "rotate-180" : ""}`} />
                </button>
                {isCatalogOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 py-1.5 bg-white rounded-lg border border-stone-200 shadow-lifted animate-fadeIn">
                    {NAV_ITEMS_CATALOGO.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setIsCatalogOpen(false)}
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
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-[18px] h-[18px]" />
                {novosPedidos > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-600 rounded-full ring-2 ring-white" />
                )}
              </button>

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

                    {suportado && disponivel && (
                      <button
                        onClick={() => {
                          handleTogglePush();
                          setIsUserOpen(false);
                        }}
                        disabled={carregando}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      >
                        {inscrito ? <BellRing className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4" />}
                        {inscrito ? "Notificações ativadas" : "Ativar notificações"}
                      </button>
                    )}

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
                      Perfil da Loja
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

        {/* Painel mobile */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin animate-fadeIn">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={closeAll} className={mobileLinkClass}>
                  <Icon className="w-4.5 h-4.5" />
                  {label}
                  {label === "Pedidos" && novosPedidos > 0 && (
                    <span className="ml-auto bg-brand-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {novosPedidos}
                    </span>
                  )}
                </NavLink>
              ))}

              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-3 mb-1 px-3">
                Catálogo
              </p>
              {NAV_ITEMS_CATALOGO.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={closeAll} className={mobileLinkClass}>
                  <Icon className="w-4.5 h-4.5" />
                  {label}
                </NavLink>
              ))}

              <div className="border-t border-stone-200 mt-3 pt-3 flex flex-col gap-0.5">
                {suportado && disponivel && (
                  <button
                    onClick={handleTogglePush}
                    disabled={carregando}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors text-left"
                  >
                    {inscrito ? <BellRing className="w-4.5 h-4.5 text-emerald-600" /> : <BellOff className="w-4.5 h-4.5" />}
                    {inscrito ? "Notificações ativadas" : "Ativar notificações"}
                  </button>
                )}
                {ehDono && (
                  <NavLink to="/admin/equipe" onClick={closeAll} className={mobileLinkClass}>
                    <UserCog className="w-4.5 h-4.5" />
                    Equipe
                  </NavLink>
                )}
                <NavLink to="/admin/perfil" onClick={closeAll} className={mobileLinkClass}>
                  <Store className="w-4.5 h-4.5" />
                  Perfil da Loja
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
