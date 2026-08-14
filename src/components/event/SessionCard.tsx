import {
  CalendarDays,
  CalendarPlus,
  Clock,
  FileText,
  PlayCircle,
  User,
  UserPlus,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";
import { DEFAULT_ZOOM_LABEL, ENDED_ZOOM_LABEL, type Session } from "@/data/event";
import { SESSION_BADGE } from "@/data/mappers";
import {
  formatSessionDate,
  formatSessionTime,
  getSessionCalendarUrl,
  hasSessionEnded,
  isSessionAccessOpen,
} from "@/data/helpers";
import { ActionLink, Badge } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Botão de ação de uma sessão. Segue a convenção dos campos de URL:
 * campo ausente não renderiza nada; string vazia renderiza desabilitado.
 */
function SessionAction({
  url,
  variant = "soft",
  children,
}: {
  url?: string | undefined;
  variant?: "solid" | "soft" | "quiet";
  children: ReactNode;
}) {
  if (url === undefined) return null;

  const released = url !== "";
  return (
    <ActionLink
      href={released ? url : "#"}
      variant={released ? variant : "disabled"}
      disabled={!released}
    >
      {children}
    </ActionLink>
  );
}

export function SessionCard({
  session,
  /** "compact" é o card do carrossel de Aulas da Semana: menor e com menos ações. */
  variant = "full",
}: {
  session: Session;
  variant?: "full" | "compact";
}) {
  const compact = variant === "compact";

  // Duas condições para liberar o acesso, e as duas precisam valer:
  //   1. existir link cadastrado (zoomUrl não vazio)
  //   2. já ter passado o momento de abertura — 30 min antes do início
  // A condição 2 não tem fim: depois de abrir, o link fica clicável para sempre.
  const zoomAvailable = isSessionAccessOpen(session.dateTime) && session.zoomUrl !== "";

  // Encerramento só conta 30 min DEPOIS do término previsto, porque aula ao vivo
  // estoura o horário. Muda apenas o texto do botão — o clique segue liberado.
  const ended = hasSessionEnded(session.dateTime, session.durationMinutes);
  const zoomLabel = ended ? ENDED_ZOOM_LABEL : (session.zoomLabel ?? DEFAULT_ZOOM_LABEL);

  const dateText = session.dateLabel ?? formatSessionDate(session.dateTime);
  const timeText = formatSessionTime(session.dateTime, session.durationMinutes);

  // Aula encerrada não tem o que agendar. Fora disso, `null` significa data mal
  // cadastrada — o adaptador já registrou o motivo no console.
  const calendarUrl = ended ? null : getSessionCalendarUrl(session);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]",
        compact ? "p-5" : "p-6 sm:p-7",
      )}
    >
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {dateText}
        </span>
        <span className="inline-flex items-center gap-1.5 font-normal text-muted-foreground">
          <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {timeText}
        </span>
      </p>

      <h3
        className={cn(
          "mt-3 font-bold leading-snug text-foreground",
          compact ? "text-base" : "text-lg sm:text-xl",
        )}
      >
        {session.title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="green">{session.category}</Badge>
        {/* Badge fixo — ver o porquê em src/data/mappers.ts. O relógio governa
            só os botões, não esta etiqueta. */}
        <Badge tone={SESSION_BADGE.tone}>{SESSION_BADGE.label}</Badge>
      </div>

      {session.topic ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Tema:</span> {session.topic}
        </p>
      ) : null}

      {session.description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{session.description}</p>
      ) : null}

      {/* `credits` tem precedência: quando existe, a sessão descreveu seus papéis
          de forma própria (host, convidados) e "Ministrado por" não se aplica. */}
      {session.credits?.length ? (
        <div className="mt-4 flex items-start gap-2 text-sm text-text-tertiary">
          <User className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {/* min-w-0 permite que nomes longos quebrem em vez de estourar o card. */}
          <div className="min-w-0 space-y-1">
            {session.credits.map((credit) => (
              <p key={credit.label}>
                {credit.label}: <span className="font-semibold text-foreground">{credit.name}</span>
              </p>
            ))}
          </div>
        </div>
      ) : session.instructor ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-text-tertiary">
          <User className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            Ministrado por{" "}
            <span className="font-semibold text-foreground">{session.instructor}</span>
          </span>
        </p>
      ) : null}

      {/* Empurra as ações para a base do card, alinhando cards de alturas diferentes. */}
      <div className="mt-auto pt-6">
        <div className="flex flex-wrap gap-3 [&>*]:w-full sm:[&>*]:w-auto">
          {/* Depois do encerramento, inscrição e acesso trocam para a aparência
              apagada (variante `quiet`) mas SEGUEM clicáveis: perdem o destaque
              visual sem bloquear quem ainda precisa deles. */}
          <SessionAction url={session.registrationUrl} variant={ended ? "quiet" : "solid"}>
            <UserPlus className="size-4" aria-hidden="true" />
            Quero me Inscrever
          </SessionAction>

          <ActionLink
            href={zoomAvailable ? session.zoomUrl : "#"}
            variant={ended ? "quiet" : "zoom"}
            disabled={!zoomAvailable}
          >
            <Video className="size-4" aria-hidden="true" />
            {zoomLabel}
          </ActionLink>

          {compact ? null : (
            <>
              {/* Abre o Google Calendar com o evento já preenchido (link de
                  template — sem login de API, sem backend). É um link de verdade
                  em vez de window.open para permitir abrir em nova aba, e porque
                  a URL já é conhecida na renderização. */}
              <ActionLink
                href={calendarUrl ?? "#"}
                variant={calendarUrl ? "soft" : "disabled"}
                disabled={!calendarUrl}
              >
                <CalendarPlus className="size-4" aria-hidden="true" />
                Adicionar ao Calendário
              </ActionLink>

              <SessionAction url={session.materialsUrl}>
                <FileText className="size-4" aria-hidden="true" />
                Acessar Materiais
              </SessionAction>
              <SessionAction url={session.replayUrl}>
                <PlayCircle className="size-4" aria-hidden="true" />
                Replay
              </SessionAction>
            </>
          )}
        </div>

        {session.note && !compact ? (
          <p className="mt-4 text-xs leading-relaxed text-text-tertiary">{session.note}</p>
        ) : null}
      </div>
    </article>
  );
}
