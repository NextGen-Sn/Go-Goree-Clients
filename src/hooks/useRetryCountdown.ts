import { useEffect, useRef, useState } from "react";

/**
 * Décompte utilisé pour désactiver un bouton pendant la fenêtre de rate limit
 * (429 Retry-After) renvoyée par le backend sur /login, /register, etc.
 */
export function useRetryCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  return { secondsLeft, start };
}
