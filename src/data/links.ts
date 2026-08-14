/**
 * ============================================================
 *  URLs GLOBAIS — fonte única
 *
 *  Os links de cada aula (Zoom, inscrição, materiais, replay) NÃO ficam
 *  aqui: são específicos por sessão e vivem em src/data/event.ts.
 * ============================================================
 */
export const links = {
  /** Botão "Entrar na Comunidade". */
  community: "https://discord.gg/ZfM3sFWrw",
  social: {
    instagram: "https://www.instagram.com/xpeducacao/",
    xp: "https://www.xpeducacao.com.br/",
    linkedin: "https://www.linkedin.com/school/xpeducacao/",
  },
} as const;

/** Âncora da seção "Agenda do Evento" — destino do CTA do topo. */
export const AGENDA_ANCHOR = "agenda";
