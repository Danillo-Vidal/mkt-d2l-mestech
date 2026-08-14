import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * true quando a pessoa pediu menos animação nas configurações do sistema.
 *
 * Usado para não iniciar o avanço automático do carrossel: movimento que começa
 * sozinho incomoda quem tem sensibilidade vestibular e atrapalha quem precisa de
 * mais tempo para ler.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    setReduced(media.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
