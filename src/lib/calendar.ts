/**
 * ============================================================================
 *  calendar.ts — CAMADA DE LÓGICA
 * ============================================================================
 *
 *  Papel na arquitetura (três camadas):
 *
 *    1. DADOS         src/data/event.ts       → única fonte de verdade das aulas
 *    2. LÓGICA        src/lib/calendar.ts     → ESTE ARQUIVO (parte genérica)
 *                     src/data/helpers.ts     → adaptador Session → evento
 *    3. APRESENTAÇÃO  SessionCard.tsx         → o botão "Adicionar ao Calendário"
 *
 *  Este arquivo é DELIBERADAMENTE AGNÓSTICO: fala de `CalendarEvent` genérico e
 *  não importa nada do projeto. Não sabe o que é uma aula, uma semana ou uma
 *  sessão. Serve igual para webinars, lives e eventos institucionais.
 *
 *  Por isso o adaptador que converte uma `Session` do evento em `CalendarEvent`
 *  mora em src/data/helpers.ts, e não aqui: manter a dependência numa só direção
 *  (data → lib, nunca lib → data) é o que garante que este arquivo continue
 *  reaproveitável em outro projeto por cópia simples.
 *
 *  ⚠️  Adicionar uma aula nova NÃO deve exigir tocar neste arquivo. Se precisou,
 *      algo saiu do contrato — provavelmente um campo que deveria ser opcional.
 */

/** Evento de calendário, sem qualquer noção do domínio deste projeto. */
export type CalendarEvent = {
  titulo: string;
  /** Início em ISO 8601 com fuso explícito (ex: "2026-09-01T19:00:00-03:00"). */
  inicio: string;
  /** Fim em ISO 8601 com fuso explícito. */
  fim: string;
  descricao?: string;
  local?: string;
};

const BASE_GOOGLE_CALENDAR = "https://calendar.google.com/calendar/render";

/**
 * Converte uma data ISO 8601 para o formato exigido pela URL do Google:
 * AAAAMMDDTHHMMSSZ (sempre UTC, indicado pelo "Z" final).
 *
 * POR QUE O FUSO PRECISA SER EXPLÍCITO NA ENTRADA:
 * sem o offset, `new Date("2026-09-01T19:00:00")` é interpretado como hora LOCAL
 * do navegador. Um aluno em Lisboa criaria o evento às 19h de Lisboa — quatro
 * horas antes da aula real. Com "-03:00", a string representa um instante
 * absoluto, e o Google exibe o horário correto no fuso de cada pessoa.
 *
 * @throws {RangeError} se a string não for uma data válida
 */
export function formatDateForGoogle(isoString: string): string {
  const data = new Date(isoString);

  if (Number.isNaN(data.getTime())) {
    throw new RangeError(
      `formatDateForGoogle: "${isoString}" não é uma data ISO 8601 válida. ` +
        `Formato esperado: 2026-09-01T19:00:00-03:00`,
    );
  }

  // toISOString() já entrega UTC: "2026-09-01T22:00:00.000Z".
  // Removemos separadores e milissegundos para chegar em "20260901T220000Z".
  return data
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/**
 * Monta a URL de template do Google Calendar para um evento qualquer.
 *
 * Abordagem de link de template: sem OAuth, sem API key, sem backend. O Google
 * abre o formulário de novo evento já preenchido, e quem decide salvar é a pessoa.
 *
 * @throws {TypeError} se faltar campo obrigatório
 * @throws {RangeError} se alguma data for inválida ou o fim não for depois do início
 */
export function gerarLinkGoogleCalendar(evento: CalendarEvent): string {
  const faltando = (["titulo", "inicio", "fim"] as const).filter((campo) => !evento[campo]);
  if (faltando.length > 0) {
    throw new TypeError(
      `gerarLinkGoogleCalendar: campos obrigatórios ausentes: ${faltando.join(", ")}.`,
    );
  }

  const inicio = formatDateForGoogle(evento.inicio);
  const fim = formatDateForGoogle(evento.fim);

  // Fim antes do início gera um evento inválido que o Google aceita calado — a
  // pessoa só descobre olhando a agenda depois. Melhor barrar aqui.
  if (new Date(evento.fim) <= new Date(evento.inicio)) {
    throw new RangeError(
      `gerarLinkGoogleCalendar: "fim" (${evento.fim}) deve ser depois de "inicio" (${evento.inicio}).`,
    );
  }

  // URLSearchParams faz o escape de acentos, "&", "#" e quebras de linha que
  // apareçam no título ou na descrição. Concatenar strings à mão quebraria a URL
  // no primeiro "&" de um texto.
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.titulo,
    details: evento.descricao ?? "",
    location: evento.local ?? "",
    sf: "true",
    output: "xml",
  });

  // `dates` é anexado à mão para preservar a barra entre início e fim. O
  // URLSearchParams a escaparia como %2F — que decodifica para "/" e funciona,
  // mas a documentação do Google mostra a barra literal, e barra é caractere
  // válido em valor de query (RFC 3986).
  return `${BASE_GOOGLE_CALENDAR}?${params.toString()}&dates=${inicio}/${fim}`;
}
