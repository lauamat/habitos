// src/components/shared/SessionRefresher.tsx
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SessionRefresher() {
  useEffect(() => {
    let active = true;

    const refresh = async () => {
      // solo “toca” la sesión para asegurarnos de que está fresca
      try {
        await supabase.auth.getSession();
      } catch (e) {
        // no bloqueamos la UI por errores aquí
        console.warn('session refresh warning:', e);
      }
    };

    // al montar, y siempre que vuelvas a la pestaña
    refresh();
    const onVisible = () => {
      if (!active) return;
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    // si cambia el estado de auth (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null; // no pinta nada
}
