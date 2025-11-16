import { useCallback, useEffect, useMemo, useState } from 'react';

export type AppRoute = 'home' | 'dashboard' | 'bookings' | 'profile' | 'admin' | 'login';

const normalize = (hash: string): AppRoute => {
  const path = hash.replace(/^#\/?/, '');
  if (path === '' || path === 'home') return 'home';
  if (path.startsWith('bookings')) return 'bookings';
  if (path.startsWith('profile')) return 'profile';
  if (path.startsWith('admin')) return 'admin';
  if (path.startsWith('login')) return 'login';
  return 'dashboard';
};
// C:\Users\srini\Documents\coding stuff\sql_ass\LAB_CS257_Group5-Final-Filters-Working_part2\LAB_CS257_Group5-Final-Filters-Working-\src\hooks\useHashRouter.ts

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


