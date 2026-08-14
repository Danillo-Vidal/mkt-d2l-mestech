import { useState } from "react";
import { GraduationCap, Lock, LockOpen } from "lucide-react";
import { exclusiveBlock, lockedContent, weeks, type WeekBlock } from "@/data/event";
import { SessionCard } from "./SessionCard";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════════
 *  🔒 INTENSIDADE DO BLOQUEIO — ajuste aqui
 *
 *  BLUR   quanto o card por baixo fica embaçado (menor = mais legível)
 *  VEIL   opacidade do véu branco sobre ele (menor = vê-se mais o card)
 *
 *  Ao passar o mouse os dois afrouxam, dando a sensação de "quase lá".
 *  Baixar demais não deixa o texto ilegível: a chamada tem fundo próprio,
 *  justamente para não depender destes valores.
 * ════════════════════════════════════════════════════════════════════════ */
const BLUR = "blur-[2px] group-hover:blur-[1px]";
const VEIL = "bg-background/55 group-hover:bg-background/45";

/**
 * Uma semana da Agenda: cabeçalho + cards.
 *
 * O arranjo dos cards vem de `week.layout` (src/data/event.ts):
 *   "stack" → uma coluna (cards largos)
 *   "grid"  → duas colunas (trilhas da Semana 3)
 */
function WeekSection({ week, first }: { week: WeekBlock; first: boolean }) {
  return (
    <section
      aria-labelledby={`agenda-${week.id}`}
      className={first ? "pb-12 last:pb-0" : "py-12 last:pb-0"}
    >
      <h3 id={`agenda-${week.id}`} className="mb-5 text-sm font-bold uppercase tracking-wide">
        <span className="text-accent-foreground">{week.label}</span>
        <span className="text-text-tertiary"> | {week.theme}</span>
      </h3>

      <WeekCards week={week} />
    </section>
  );
}

/** A grade de cards da semana, sem cabeçalho nem bloqueio. */
function WeekGrid({ week }: { week: WeekBlock }) {
  return (
    <div className={week.layout === "grid" ? "grid gap-5 sm:grid-cols-2" : "grid gap-5"}>
      {week.sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}

/**
 * A semana como aparece dentro do bloco: aberta, ou borrada sob uma chamada única.
 *
 * A chamada cobre a GRADE INTEIRA, não card a card. Repetindo por card, uma
 * semana de quatro aulas mostraria quatro cadeados e quatro botões idênticos —
 * ruído visual e quatro vezes o mesmo pedido. Um bloqueio, uma mensagem, um CTA.
 *
 * Os cards por baixo NÃO são alterados: são os mesmos `SessionCard` das semanas
 * abertas, apenas borrados. É o que mantém a estrutura idêntica entre os dois
 * estados.
 *
 * ⚠️  Isto NÃO protege o conteúdo: o texto continua no HTML e aparece no
 *     código-fonte da página. É recurso de conversão, não de segurança.
 */
function WeekCards({ week }: { week: WeekBlock }) {
  if (!week.locked) return <WeekGrid week={week} />;

  return (
    <div className="group relative">
      {/*
       * `inert` remove a subárvore da navegação por teclado E da árvore de
       * acessibilidade. Só `pointer-events-none` bloquearia o mouse mas deixaria
       * os links dos cards alcançáveis por Tab — foco invisível em conteúdo que
       * a pessoa não pode usar.
       */}
      <div className={cn("select-none transition-all duration-500", BLUR)} inert>
        <WeekGrid week={week} />
      </div>

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-colors duration-500",
          VEIL,
        )}
      >
        {/*
         * Fixa no centro do bloco, sem acompanhar a rolagem.
         *
         * Consequência a conhecer: numa semana de quatro aulas a grade é alta, e
         * ao chegar pelo topo a mensagem começa abaixo da dobra — aparece
         * conforme se rola. Foi escolha deliberada; a alternativa (`sticky`)
         * mantinha a mensagem sempre visível, mas ela se mexia sozinha na tela.
         */}
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <span
            className="animate-pulse-lock flex size-14 items-center justify-center rounded-full border border-xp-green/40 bg-xp-green-soft text-xp-green"
            aria-hidden="true"
          >
            <Lock className="size-6" />
          </span>

          {/* Fundo próprio: a chamada precisa continuar legível por cima dos cards
              borrados, sem depender da opacidade do véu escolhida acima. */}
          <div className="rounded-xl bg-background/95 px-5 py-4">
            <p className="text-base font-bold text-foreground sm:text-lg">{lockedContent.title}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {lockedContent.subtitle}
            </p>
          </div>

          <a
            href={lockedContent.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-foreground shadow-[var(--shadow-card)] transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LockOpen className="size-4" aria-hidden="true" />
            {lockedContent.ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Bloco verde das semanas restritas: cabeçalho + guias + a semana escolhida.
 *
 * Os cabeçalhos que antes ficavam empilhados ("Semana 2 | Tendências e Mercado
 * para 2026") viraram as guias. Só a semana selecionada é exibida.
 */
function ExclusiveGroup({ blockWeeks }: { blockWeeks: WeekBlock[] }) {
  const [selected, setSelected] = useState(0);
  const week = blockWeeks[selected];

  if (!week) return null;

  const headingId = `exclusivo-${blockWeeks[0]?.id ?? "grupo"}`;

  return (
    <div
      aria-labelledby={headingId}
      className="rounded-2xl border border-primary/30 bg-accent px-5 py-8 sm:px-8 sm:py-10"
    >
      <header className="mb-6 flex items-start gap-3">
        {/* Verde escurecido, não o --primary: ícone branco sobre --primary dá
            2,76:1 e reprova o mínimo de 3:1 para elementos gráficos (WCAG
            1.4.11). Sobre --accent-foreground são 5,08:1. */}
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-foreground"
          aria-hidden="true"
        >
          <GraduationCap className="size-5 text-white" />
        </span>
        <div className="min-w-0">
          <h3 id={headingId} className="text-lg font-bold leading-snug text-foreground sm:text-xl">
            {exclusiveBlock.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-on-accent">
            {exclusiveBlock.subtitle}
          </p>
        </div>
      </header>

      {/* Guias. Não é o padrão ARIA de abas: existe um painel só, que troca de
          conteúdo — `aria-current` descreve isso com honestidade. */}
      <nav aria-label="Semanas da área exclusiva" className="grid gap-2 sm:flex sm:flex-wrap">
        {blockWeeks.map((item, index) => {
          const active = index === selected;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => setSelected(index)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "bg-xp-green text-white"
                  : "bg-background text-foreground hover:bg-background/70",
              )}
            >
              <span>
                {item.label}
                {/* Branco cheio, não /90: a 90% de opacidade o contraste sobre o
                    verde cai para 3,96:1 e reprova em AA. */}
                <span
                  className={cn("font-normal", active ? "text-white" : "text-muted-foreground")}
                >
                  {" "}
                  | {item.theme}
                </span>
              </span>
              {item.locked ? (
                <Lock
                  className={cn("size-3.5 shrink-0", active ? "text-white" : "text-xp-green")}
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* key por semana: remonta o bloco e reinicia o fade a cada troca. */}
      <div
        key={week.id}
        aria-label={`Aulas da ${week.label}`}
        className="mt-6 duration-300 animate-in fade-in"
      >
        <WeekCards week={week} />
      </div>
    </div>
  );
}

type WeekGroup = { exclusive: boolean; weeks: WeekBlock[] };

/**
 * Agrupa semanas CONSECUTIVAS que compartilham a marca `exclusive`.
 *
 * É o que faz as Semanas 2, 3 e 4 caírem num único bloco verde em vez de um
 * bloco por semana. Se uma semana aberta aparecesse no meio delas, o bloco se
 * dividiria em dois — o agrupamento respeita a ordem do array.
 */
function groupWeeks(list: WeekBlock[]): WeekGroup[] {
  return list.reduce<WeekGroup[]>((groups, week) => {
    const exclusive = week.exclusive === true;
    const current = groups.at(-1);

    if (current && current.exclusive === exclusive) current.weeks.push(week);
    else groups.push({ exclusive, weeks: [week] });

    return groups;
  }, []);
}

/** "Agenda do Evento" — listagem completa, semana a semana. */
export function Agenda() {
  const groups = groupWeeks(weeks);

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const key = group.weeks[0]?.id ?? "grupo";

        if (group.exclusive) return <ExclusiveGroup key={key} blockWeeks={group.weeks} />;

        return (
          <div key={key} className="divide-y divide-border">
            {group.weeks.map((week, index) => (
              <WeekSection key={week.id} week={week} first={index === 0} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
