import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getCurrentSession } from '../../lib/supabase';

type State = 'boot' | 'authLoading' | 'noSession' | 'loading' | 'ready' | 'error';

async function pingHabits(userId: string) {
  const { error } = await supabase
    .from('habits')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId)
    .limit(1);
  if (error) throw error;
}

export default function HabitsGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>('boot');
  const [msg, setMsg] = useState('');
  const [revKey, setRevKey] = useState<number>(0);   // fuerza re-montar la app
  const loadTimer = useRef<number | null>(null);

  const clearLoadTimer = () => {
    if (loadTimer.current) {
      window.clearTimeout(loadTimer.current);
      loadTimer.current = null;
    }
  };

  const load = useCallback(async () => {
    try {
      clearLoadTimer();
      setState('authLoading');

      const session = await getCurrentSession();
      if (!session?.user?.id) {
        setState('noSession');
        return;
      }

      setState('loading');

      // si en 3.5s no pasamos a 'ready', hacemos fallback (soft reload)
      loadTimer.current = window.setTimeout(() => {
        // re-montamos hijos (resetea loaders internos)
        setRevKey(Date.now());
      }, 3500);

      await pingHabits(session.user.id);

      clearLoadTimer();
      setState('ready');

      // al quedar 'ready', también forzamos re-montaje por si algún loader interno quedó colgado
      setRevKey(Date.now());
    } catch (e: any) {
      clearLoadTimer();
      console.error(e);
      setMsg(e?.message ?? 'Failed to load');
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();

    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      sub.subscription.unsubscribe();
      clearLoadTimer();
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

  // clave: renderizamos los hijos con una key que cambia al volver a la pestaña,
  // forzando que se desmonten/monten (resetea sus loaders internos).
  return <div key={revKey}>{children}</div>;
}
