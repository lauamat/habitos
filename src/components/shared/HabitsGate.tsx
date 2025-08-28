import React, { useEffect, useState, useCallback } from 'react';
import { supabase, getCurrentSession } from '../../lib/supabase';

type State = 'boot' | 'authLoading' | 'noSession' | 'loading' | 'ready' | 'error';

/**
 * Hace un “ping” muy barato a la tabla para comprobar
 * que la sesión y la BD responden. No usa helpers ni timeout.
 */
async function pingHabits(userId: string) {
  const { error: pingError } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true }) // no trae data, solo comprueba acceso
    .eq('user_id', userId)
    .limit(1);

  if (pingError) throw pingError;
}

export default function HabitsGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>('boot');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setState('authLoading');

      const session = await getCurrentSession();
      if (!session?.user?.id) {
        setState('noSession');
        return;
      }

      setState('loading');
      await pingHabits(session.user.id);
      setState('ready');
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? 'Failed to load');
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();

    // Revalidar al volver a la pestaña
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Reaccionar a cambios de sesión (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      sub.subscription.unsubscribe();
    };
  }, [load]);

  if (state === 'boot' || state === 'authLoading' || state === 'loading') {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading your habits…</div>;
  }

  if (state === 'noSession') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>You’re logged out.</p>
        <a href="/login">Sign in</a>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>We couldn’t load your habits.</p>
        <code style={{ display: 'block', margin: '8px 0' }}>{msg}</code>
        <button onClick={load}>Try again</button>
      </div>
    );
  }

  return <>{children}</>;
}
