import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · MyLineUp` : 'MyLineUp';
    return () => { document.title = 'MyLineUp'; };
  }, [title]);
}
