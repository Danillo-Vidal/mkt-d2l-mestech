import type { MouseEvent, ReactNode } from "react";
import { smoothScrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";

export function Badge({
  tone = "green",
  children,
  className,
}: {
  tone?: "green" | "yellow" | "gray";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tone === "green" && "bg-accent text-accent-foreground",
        tone === "yellow" && "bg-warning-soft text-warning",
        tone === "gray" && "bg-surface-alt text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Section({
  children,
  alt = false,
  className,
  id,
}: {
  children: ReactNode;
  alt?: boolean;
  className?: string;
  /** Define a âncora da seção (destino de links "#id"). */
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("px-4 py-12 sm:px-6 sm:py-16", alt && "bg-surface-alt", className)}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8 max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      ) : null}
    </header>
  );
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export const buttonStyles = {
  /** Ação principal — verde preenchido. */
  solid: cn(base, "bg-primary text-primary-foreground hover:bg-primary/90"),
  /** Ação secundária — verde claro (materiais, replay). */
  soft: cn(base, "bg-accent text-accent-foreground hover:bg-accent/70"),
  outline: cn(base, "border border-border bg-background text-accent-foreground hover:bg-accent/60"),
  ghost: cn(base, "border border-border bg-background text-foreground hover:bg-surface-alt"),
  /** Botão Zoom — verde com hover azul. */
  zoom: cn(base, "bg-primary text-white hover:bg-info hover:text-info-foreground"),
  /**
   * Mesma aparência do desabilitado, porém CLICÁVEL.
   *
   * Serve para ação que perdeu prioridade mas continua válida — o acesso a uma
   * aula já encerrada, por exemplo. Comunica "não é mais o caminho principal"
   * sem tirar a possibilidade de quem ainda precisa.
   *
   * O hover escurece o texto em vez de mudar o fundo: manter o fundo preserva o
   * contraste de 4,5:1, enquanto clarear/escurecer o fundo o derrubaria.
   */
  quiet: cn(base, "border border-border bg-surface-alt text-text-tertiary hover:text-foreground"),
  /** Aparência apagada E bloqueada — sem link cadastrado. */
  disabled: cn(base, "cursor-not-allowed border border-border bg-surface-alt text-text-tertiary"),
};

export function ActionLink({
  href,
  variant = "solid",
  disabled,
  children,
  className,
}: {
  href: string;
  variant?: keyof typeof buttonStyles;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(buttonStyles.disabled, className)}>
        {children}
      </span>
    );
  }

  const isInPageAnchor = href.startsWith("#");

  /**
   * Links internos ("#agenda") rolam com animação em vez de saltar.
   *
   * Continua sendo um <a> com href de verdade: quem abre em nova aba, copia o
   * endereço ou navega sem JavaScript mantém o comportamento normal do navegador.
   */
  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Respeita ctrl/cmd/shift+clique e botão do meio — a pessoa quer outra aba.
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    // Só intercepta se o destino existir. Âncora quebrada segue o padrão do
    // navegador, em vez de virar um clique que não faz nada.
    if (smoothScrollToId(href.slice(1))) {
      event.preventDefault();
    }
  };

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      onClick={isInPageAnchor ? handleAnchorClick : undefined}
      className={cn(buttonStyles[variant], className)}
    >
      {children}
    </a>
  );
}
