import { gerarLinkGoogleCalendar } from "@/lib/calendar";
import type { Session, WeekBlock } from "./event";

/* ════════════════════════════════════════════════════════════════════════════
 *  REGRAS DE HORÁRIO — as duas margens em torno de uma aula
 *
 *  Elas são independentes e resolvem coisas diferentes. Mudar uma não deve
 *  mexer na outra, e é por isso que são duas constantes e não uma só.
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * Antecedência com que o acesso à aula é liberado.
 *
 * Ex: com 30 e uma aula às 19h, o link fica clicável a partir das 18h30.
 *
 * ⚠️  Se este número for citado em algum texto voltado ao aluno (FAQ, avisos),
 *     os dois precisam mudar juntos — senão a página promete uma coisa e faz
 *     outra.
 */
const LIVE_WINDOW_MINUTES = 30;

/**
 * Tolerância depois do término previsto, antes de a aula ser tratada como
 * encerrada.
 *
 * Existe porque aula ao vivo estoura o horário: uma aula de 19h às 20h30 pode
 * seguir até 21h. Sem essa margem, às 20h30 em ponto o botão passaria a dizer
 * "Aula encerrada" enquanto o professor ainda está falando — e o aluno que
 * chegasse atrasado acharia que perdeu.
 *
 * Ex: com 30, uma aula que termina 20h30 só é considerada encerrada às 21h.
 */
const OVERTIME_TOLERANCE_MINUTES = 30;

/**
 * O acesso à aula está liberado?
 *
 * Abre 30 min antes do início e **não fecha**: passado esse momento, o link
 * segue clicável indefinidamente. É de propósito — a gravação e a sala podem
 * continuar úteis depois da aula, e um link que morre no minuto do encerramento
 * deixa quem chegou atrasado sem nada.
 *
 * Governa se o botão de acesso está clicável.
 */
export function isSessionAccessOpen(dateTimeISO: string, now = new Date()): boolean {
  const opensAt = new Date(dateTimeISO).getTime() - LIVE_WINDOW_MINUTES * 60 * 1000;
  return now.getTime() >= opensAt;
}

/**
 * A aula já terminou, considerando a tolerância de prorrogação?
 *
 * Só vira `true` em: início + duração + 30 min. Governa o TEXTO do botão de
 * acesso ("Aula encerrada") e o desligamento do "Adicionar ao Calendário" —
 * nunca o clique do acesso, que permanece liberado.
 */
export function hasSessionEnded(
  dateTimeISO: string,
  durationMinutes: number,
  now = new Date(),
): boolean {
  const endsAt =
    new Date(dateTimeISO).getTime() + (durationMinutes + OVERTIME_TOLERANCE_MINUTES) * 60 * 1000;
  return now.getTime() >= endsAt;
}

/**
 * Semana que deve vir selecionada ao abrir a página: a primeira que ainda tem
 * alguma sessão por acontecer. Depois do evento, cai na última.
 */
export function getCurrentWeekIndex(weeks: WeekBlock[], now = new Date()): number {
  const index = weeks.findIndex((week) =>
    week.sessions.some((session) => {
      const end = new Date(session.dateTime).getTime() + session.durationMinutes * 60 * 1000;
      return end > now.getTime();
    }),
  );
  return index === -1 ? weeks.length - 1 : index;
}

/**
 * Texto que vai no campo de detalhes do evento no calendário.
 *
 * Repete o link do Zoom aqui de propósito: quando o aluno abrir o compromisso na
 * agenda, no dia da aula, ele precisa do link ali — e não de voltar à página
 * para procurá-lo.
 */
function buildCalendarDescription(session: Session): string {
  const linhas: string[] = [];

  if (session.description) linhas.push(session.description);
  if (session.topic) linhas.push(`Tema: ${session.topic}`);
  if (session.instructor) linhas.push(`Ministrado por: ${session.instructor}`);
  if (session.zoomUrl) linhas.push(`Acesso: ${session.zoomUrl}`);

  return linhas.join("\n\n");
}

/**
 * ADAPTADOR entre a camada de dados e a lógica genérica de calendário.
 *
 * Converte uma `Session` deste evento no `CalendarEvent` agnóstico que
 * src/lib/calendar.ts entende. É aqui — e só aqui — que se sabe que uma sessão
 * guarda duração em minutos em vez de hora de término.
 *
 * Devolve `null` em vez de lançar: uma data mal cadastrada em event.ts
 * desabilita apenas este botão, com erro nomeado no console, em vez de derrubar
 * a página inteira do evento.
 */
export function getSessionCalendarUrl(session: Session): string | null {
  const start = new Date(session.dateTime);

  if (Number.isNaN(start.getTime())) {
    console.error(
      `[calendário] A sessão "${session.id}" tem dateTime inválido ("${session.dateTime}"). ` +
        `O botão "Adicionar ao Calendário" ficará desabilitado. ` +
        `Formato esperado: 2026-09-01T19:00:00-03:00`,
    );
    return null;
  }

  const end = new Date(start.getTime() + session.durationMinutes * 60 * 1000);

  try {
    return gerarLinkGoogleCalendar({
      titulo: session.title,
      inicio: session.dateTime,
      // toISOString() devolve UTC com "Z" — fuso explícito, como a lógica exige.
      fim: end.toISOString(),
      descricao: buildCalendarDescription(session),
      // Sem link definido ainda, o local genérico já informa que é remoto.
      local: session.zoomUrl || "Online — Zoom",
    });
  } catch (erro) {
    console.error(
      `[calendário] Não foi possível montar o link da sessão "${session.id}": ` +
        `${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return null;
  }
}

/**
 * Intervalo de datas de uma semana, derivado das próprias sessões.
 *
 * Ex: "15/09 a 22/09" quando há dias diferentes, ou "08/09" quando todas as
 * aulas caem no mesmo dia.
 *
 * É derivado de propósito: um campo digitado à mão sairia de sincronia na
 * primeira vez que uma aula mudasse de data, sem nenhum erro aparente.
 */
export function getWeekDateRange(week: WeekBlock, locale = "pt-BR"): string {
  const dia = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });

  const ordenadas = week.sessions
    .map((session) => new Date(session.dateTime).getTime())
    .sort((a, b) => a - b);

  const primeiro = ordenadas.at(0);
  const ultimo = ordenadas.at(-1);
  if (primeiro === undefined || ultimo === undefined) return "";

  const inicio = dia(new Date(primeiro).toISOString());
  const fim = dia(new Date(ultimo).toISOString());

  return inicio === fim ? inicio : `${inicio} a ${fim}`;
}

export function formatSessionDate(dateTimeISO: string, locale = "pt-BR"): string {
  const date = new Date(dateTimeISO);
  const dayName = date.toLocaleDateString(locale, { weekday: "long" });
  const dayMonth = date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${dayMonth} · ${capitalizedDay}`;
}

export function formatSessionTime(
  dateTimeISO: string,
  durationMinutes: number,
  locale = "pt-BR",
): string {
  const start = new Date(dateTimeISO);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startTime = start.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endTime = end.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${startTime.replace(":", "h")} às ${endTime.replace(":", "h")}`;
}
