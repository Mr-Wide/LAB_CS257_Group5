import { useCallback, useEffect, useMemo, useState } from 'react';

export type AppRoute = 'dashboard' | 'bookings' | 'profile' | 'admin' | 'login';

const normalize = (hash: string): AppRoute => {
  const path = hash.replace(/^#\/?/, '');
  if (path.startsWith('bookings')) return 'bookings';
  if (path.startsWith('profile')) return 'profile';
  if (path.startsWith('admin')) return 'admin';
  if (path.startsWith('login')) return 'login';
  return 'dashboard';
};

export const useHashRouter = () => {
  const [route, setRoute] = useState<AppRoute>(() => normalize(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(normalize(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    const hash = next === 'dashboard' ? '#/' : `#/${next}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(next);
  }, []);

  return useMemo(() => ({ route, navigate }), [route, navigate]);
};


