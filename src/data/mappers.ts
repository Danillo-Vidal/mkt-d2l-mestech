/**
 * Badge de situação exibido em cada card de aula.
 *
 * É FIXO em "Confirmado", por decisão de produto: "Em breve" era lido por parte
 * dos alunos como "ainda não confirmamos esta aula", o que enfraquecia a
 * programação. O badge afirma que a aula vai acontecer; QUANDO ela acontece já
 * está na data e na hora exibidas no próprio card, logo acima.
 *
 * ⚠️  O relógio NÃO mexe neste badge. Ele governa apenas a disponibilidade dos
 *     botões — acesso ao Zoom e "Adicionar ao Calendário". A janela de liberação
 *     está em LIVE_WINDOW_MINUTES (src/data/helpers.ts).
 *
 * Para voltar a um badge que mude com o horário, este arquivo é o ponto de
 * partida: as funções de data (`isSessionAccessOpen`, `hasSessionEnded`) já
 * existem em src/data/helpers.ts e podem alimentar a escolha do rótulo.
 */
export const SESSION_BADGE = {
  tone: "green" as const,
  label: "Confirmado",
};
