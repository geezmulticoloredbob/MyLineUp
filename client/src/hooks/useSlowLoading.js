import { useEffect, useState } from 'react';

// Render's free tier spins the server down after 15min idle, so the first
// request after a gap can take up to a minute. A plain "loading" state
// looks identical to a hang for that whole window; this flips true only
// once a request has been pending long enough that a cold start, not a
// normal fetch, is the likely cause.
export function useSlowLoading(isPending, delayMs = 3000) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [isPending, delayMs]);

  return isSlow;
}
