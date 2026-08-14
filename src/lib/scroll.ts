/**
 * ============================================================================
 *  scroll.ts — rolagem animada até uma âncora da página
 * ============================================================================
 *
 *  POR QUE EM JAVASCRIPT E NÃO `scroll-behavior: smooth` NO CSS:
 *
 *  A versão em CSS torna animada TODA rolagem da página, inclusive as que o
 *  próprio framework dispara. O TanStack Router está com `scrollRestoration`
 *  ligado (src/router.tsx) e reposiciona a página em navegações — trocar o hash
 *  conta como navegação. As duas rolagens competem, uma corta a outra no meio, e
 *  o resultado é a página andar um trecho curto e parar.
 *
 *  Aqui a animação é nossa: o clique não muda o hash (então o router não entra
 *  em cena) e a posição é escrita quadro a quadro. Em troca, ganhamos duração
 *  previsível e cancelamento quando a pessoa assume o controle.
 *
 *  ⚠️  Para isto funcionar, o CSS precisa manter `scroll-behavior: auto`. Se
 *      alguém reintroduzir `smooth` lá, cada passo desta animação vira uma nova
 *      animação do navegador e a rolagem volta a engasgar.
 */

/* ════════════════════════════════════════════════════════════════════════
 *  ⏱️  DURAÇÃO DA ROLAGEM — ajuste aqui
 *
 *  A duração é proporcional à distância, limitada por estes extremos (ms).
 *  Trajeto curto termina rápido; trajeto longo não se arrasta.
 * ════════════════════════════════════════════════════════════════════════ */
const MIN_DURATION_MS = 450;
const MAX_DURATION_MS = 900;

/** Milissegundos de animação por 1000px percorridos. */
const MS_PER_1000PX = 400;

/** Folga acima do alvo, para o conteúdo não colar no topo da janela. */
const TOP_OFFSET_PX = 16;

/** Aceleração suave na saída e na chegada — o miolo é a parte rápida. */
function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Rola a página até `element` com animação.
 *
 * Sem animação quando a pessoa pediu menos movimento no sistema — nesse caso vai
 * direto ao destino, que é o comportamento correto e não uma degradação.
 */
export function smoothScrollToElement(element: Element): void {
  const startY = window.scrollY;

  // Limita ao fim rolável: um alvo perto do rodapé não tem 2000px abaixo dele, e
  // sem esse limite a animação "termina" numa posição que a página não alcança.
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const rawTarget = element.getBoundingClientRect().top + startY - TOP_OFFSET_PX;
  const destination = Math.max(0, Math.min(rawTarget, maxScroll));

  const distance = destination - startY;
  if (Math.abs(distance) < 2) return;

  if (prefersReducedMotion()) {
    window.scrollTo(0, destination);
    return;
  }

  const duration = Math.min(
    MAX_DURATION_MS,
    Math.max(MIN_DURATION_MS, (Math.abs(distance) / 1000) * MS_PER_1000PX),
  );

  let cancelled = false;

  /**
   * Se a pessoa girar a roda, arrastar na tela ou usar o teclado, ela assumiu o
   * controle — insistir na animação seria brigar com quem está no comando.
   */
  const cancel = () => {
    cancelled = true;
  };
  const events = ["wheel", "touchstart", "keydown"] as const;
  events.forEach((name) => window.addEventListener(name, cancel, { passive: true, once: true }));

  const cleanup = () => {
    events.forEach((name) => window.removeEventListener(name, cancel));
  };

  const startTime = performance.now();

  const step = (agora: number) => {
    if (cancelled) {
      cleanup();
      return;
    }

    const elapsed = agora - startTime;
    const progress = Math.min(1, elapsed / duration);

    window.scrollTo(0, startY + distance * easeInOutCubic(progress));

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      cleanup();
    }
  };

  requestAnimationFrame(step);
}

/**
 * Rola até o elemento de `id`. Devolve `false` quando não existe elemento com
 * aquele id — assim quem chamou pode deixar o navegador seguir o comportamento
 * padrão do link em vez de engolir o clique.
 */
export function smoothScrollToId(id: string): boolean {
  const element = document.getElementById(id);
  if (!element) return false;

  smoothScrollToElement(element);
  return true;
}
