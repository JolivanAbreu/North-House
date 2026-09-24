import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.mjs';

// Converte a chave pública VAPID (base64url) para o formato Uint8Array
// que a Push API do navegador espera.
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const usePushNotifications = () => {
  const [suportado, setSuportado] = useState(false);
  const [inscrito, setInscrito] = useState(false);
  const [disponivel, setDisponivel] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const podeUsar = 'serviceWorker' in navigator && 'PushManager' in window;
    setSuportado(podeUsar);
    if (!podeUsar) return;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.mjs');
        const subscription = await registration.pushManager.getSubscription();
        setInscrito(Boolean(subscription));

        const { data } = await api.get('/push/vapid-public-key');
        setDisponivel(Boolean(data.disponivel));
      } catch (error) {
        console.error('Erro ao verificar notificações push:', error);
      }
    })();
  }, []);

  const ativar = useCallback(async () => {
    setCarregando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') {
        return { ok: false, motivo: 'Permissão de notificação negada.' };
      }

      const { data } = await api.get('/push/vapid-public-key');
      if (!data.disponivel || !data.chave) {
        return { ok: false, motivo: 'A loja ainda não configurou notificações push (chaves VAPID).' };
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.chave),
      });

      const subJson = subscription.toJSON();
      await api.post('/push/inscrever', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setInscrito(true);
      return { ok: true };
    } catch (error) {
      console.error('Erro ao ativar notificações push:', error);
      return { ok: false, motivo: 'Não foi possível ativar as notificações.' };
    } finally {
      setCarregando(false);
    }
  }, []);

  const desativar = useCallback(async () => {
    setCarregando(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.post('/push/desinscrever', { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setInscrito(false);
      return { ok: true };
    } catch (error) {
      console.error('Erro ao desativar notificações push:', error);
      return { ok: false };
    } finally {
      setCarregando(false);
    }
  }, []);

  return { suportado, inscrito, disponivel, carregando, ativar, desativar };
};

export default usePushNotifications;
