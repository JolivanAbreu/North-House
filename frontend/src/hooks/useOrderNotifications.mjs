import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import api from "../services/api.mjs";

const STORAGE_KEY = "sgv-last-seen-pedido-id";

// Faz polling da lista de pedidos do admin e detecta novos pedidos
// desde a última visita, disparando um toast e mantendo uma contagem
// para o sininho de notificações no painel.
const useOrderNotifications = () => {
  const [novosPedidos, setNovosPedidos] = useState(0);
  const lastSeenRef = useRef(parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10));
  const isFirstCheck = useRef(true);

  const checkForNewOrders = useCallback(async () => {
    try {
      const response = await api.get("/pedidos/admin");
      const pedidos = response.data || [];
      if (pedidos.length === 0) return;

      const maiorId = Math.max(...pedidos.map((p) => p.id));
      const eraPrimeiraChecagem = isFirstCheck.current;

      if (eraPrimeiraChecagem) {
        isFirstCheck.current = false;
        if (lastSeenRef.current === 0) {
          lastSeenRef.current = maiorId;
          localStorage.setItem(STORAGE_KEY, String(maiorId));
        }
      }

      const pendentes = pedidos.filter((p) => p.id > lastSeenRef.current);

      if (pendentes.length > 0) {
        setNovosPedidos(pendentes.length);
        // Só avisa com toast se não for a primeira checagem da sessão
        // (senão o admin seria "surpreendido" com pedidos antigos toda vez que abre o painel).
        if (!eraPrimeiraChecagem) {
          const ultimo = pendentes[0];
          toast.success(`Novo pedido recebido de ${ultimo.nome_cliente}!`, { icon: "🛎️" });
        }
      }
    } catch {
      // Falha silenciosa - não é crítico para a experiência do admin
    }
  }, []);

  useEffect(() => {
    checkForNewOrders();
    const interval = setInterval(checkForNewOrders, 25000);
    return () => clearInterval(interval);
  }, [checkForNewOrders]);

  const marcarComoVisto = useCallback(() => {
    api.get("/pedidos/admin").then((response) => {
      const pedidos = response.data || [];
      if (pedidos.length > 0) {
        const maiorId = Math.max(...pedidos.map((p) => p.id));
        lastSeenRef.current = maiorId;
        localStorage.setItem(STORAGE_KEY, String(maiorId));
      }
      setNovosPedidos(0);
    }).catch(() => setNovosPedidos(0));
  }, []);

  return { novosPedidos, marcarComoVisto };
};

export default useOrderNotifications;
