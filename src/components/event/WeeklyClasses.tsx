import { useEffect, useState } from "react";
import { weeks, type WeekBlock } from "@/data/event";
import { getCurrentWeekIndex } from "@/data/helpers";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { SessionCard } from "./SessionCard";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════════
 *  ⏱️  TEMPO DO CARROSSEL — ajuste aqui
 *
 *  Intervalo entre a passagem automática de uma aula para a próxima,
 *  em milissegundos (1000 = 1 segundo).
 *
 *      3000  → 3 segundos (rápido, bom para testar)
 *      6000  → 6 segundos (padrão)
 *     10000  → 10 segundos (lento, mais tempo de leitura)
 * ════════════════════════════════════════════════════════════════════════ */
const AUTOPLAY_MS = 2000;

/**
 * Largura de cada card, por faixa de tela.
 *
 * ⚠️  Cada card ocupa MAIS DE METADE da largura de propósito: é o que garante que
 *     duas aulas já não caibam juntas e o carrossel tenha para onde avançar.
 *     Se algum valor passar a caber tudo de uma vez (ex: `lg:basis-1/3` com só
 *     duas aulas), não há rolagem possível e o avanço automático não faz nada.
 */
const SLIDE_WIDTH = "basis-full sm:basis-4/5 lg:basis-3/5";

/**
 * Carrossel das aulas de UMA semana, com passagem automática por tempo.
 *
 * Fica em componente separado de propósito: montado com `key={week.id}`, todo o
 * seu estado (aula atual, posição) é descartado e recriado ao trocar de semana —
 * sem precisar reiniciar nada à mão.
 */
function WeekCarousel({ week }: { week: WeekBlock }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  /** Ponteiro sobre o carrossel ou foco dentro dele: suspende a passagem. */
  const [interacting, setInteracting] = useState(false);

  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!api) return;

    const update = () => {
      setCurrent(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
      setScrollable(api.canScrollPrev() || api.canScrollNext());
    };
    update();

    // "reInit" cobre o redimensionamento da janela, que muda quantos cards cabem.
    api.on("reInit", update);
    api.on("select", update);

    return () => {
      api.off("reInit", update);
      api.off("select", update);
    };
  }, [api]);

  // Só roda o tempo quando há mais de uma posição e ninguém está interagindo.
  const autoplayOn = Boolean(api) && scrollable && !interacting && !reducedMotion;

  useEffect(() => {
    if (!api || !autoplayOn) return;

    // Ciclo explícito em vez da opção `loop` do Embla: com poucos slides, o loop
    // clona elementos e o índice inicial fica imprevisível. Aqui, ao chegar na
    // última aula, o próximo passo volta para a primeira.
    const timer = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [api, autoplayOn]);

  return (
    <div
      // Passar o mouse ou entrar com o foco suspende a passagem, para dar tempo de
      // ler o card e de alcançar os links dentro dele sem que ele escape.
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm font-semibold text-accent-foreground">{week.theme}</p>

        {scrollable ? (
          <div className="flex shrink-0 gap-1.5" role="tablist" aria-label="Aulas desta semana">
            {Array.from({ length: snapCount }, (_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === current}
                aria-label={`Aula ${index + 1} de ${snapCount}`}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "size-2.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  index === current ? "bg-primary" : "bg-border hover:bg-text-tertiary",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Carousel setApi={setApi} opts={{ align: "start" }}>
        <CarouselContent>
          {week.sessions.map((session) => (
            <CarouselItem key={session.id} className={SLIDE_WIDTH}>
              <SessionCard session={session} variant="compact" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

/**
 * "Aulas da Semana" — botões de semana + carrossel das aulas daquela semana.
 *
 * As aulas passam sozinhas, de tempo em tempo (ver AUTOPLAY_MS no topo deste
 * arquivo). Os botões de semana trocam qual semana está em exibição.
 *
 * Para adicionar uma aula, acrescente um item em `weeks[].sessions`
 * (src/data/event.ts): ela entra no carrossel e na Agenda automaticamente.
 */
export function WeeklyClasses() {
  const [selected, setSelected] = useState(() => getCurrentWeekIndex(weeks));
  const week = weeks[selected];

  if (!week) return null;

  return (
    <div>
      <nav aria-label="Semanas do evento" className="flex flex-wrap gap-2">
        {weeks.map((item, index) => {
          const active = index === selected;
          return (
            <button
              key={item.id}
              type="button"
              // aria-current marca a semana em exibição. Não usamos o padrão de
              // abas porque não existe um painel por botão: há um só painel, que
              // troca de conteúdo.
              aria-current={active ? "true" : undefined}
              onClick={() => setSelected(index)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-tab-idle text-foreground hover:bg-border",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6" aria-live="polite">
        <WeekCarousel key={week.id} week={week} />
      </div>
    </div>
  );
}
