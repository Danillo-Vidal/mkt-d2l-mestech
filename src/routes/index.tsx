import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  Globe,
  Instagram,
  Linkedin,
  MessagesSquare,
  Users,
} from "lucide-react";
import { community, communityBenefits, faq, footer, hero, notices, sections } from "@/data/event";
import { images } from "@/data/images";
import { AGENDA_ANCHOR, links } from "@/data/links";
import { ActionLink, Badge, Section, SectionTitle } from "@/components/event/ui";
import { Agenda } from "@/components/event/Agenda";
import { Banner } from "@/components/event/Banner";
import { Faq } from "@/components/event/Faq";
import { WeeklyClasses } from "@/components/event/WeeklyClasses";

// Meta tags ficam em index.html — o build estático não executa head() no servidor.
export const Route = createFileRoute("/")({
  component: Index,
});

const socialIcons = {
  instagram: Instagram,
  xp: Globe,
  linkedin: Linkedin,
} as const;

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function Index() {
  return (
    <main className="min-h-screen bg-background">
      {/* 0. BANNER */}
      <div className="px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mx-auto w-full max-w-5xl">
          <Banner image={images.banner} priority className="rounded-2xl" />
        </div>
      </div>

      {/* 1. HERO */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {hero.title}
          </h1>
          <div className="mt-5 max-w-3xl space-y-4">
            {hero.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-8">
            <ActionLink href={`#${AGENDA_ANCHOR}`} variant="solid" className="text-white">
              <CalendarDays className="size-4" aria-hidden="true" />
              {hero.ctaLabel}
            </ActionLink>
          </div>
        </div>
      </section>

      {/* 3. AVISOS */}
      <Section alt>
        <SectionTitle title={sections.notices} />
        <ul className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {notices.map((notice, index) => (
            <li key={notice} className="flex gap-3">
              <span
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">{notice}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 5. AGENDA DO EVENTO */}
      <Section alt className="scroll-mt-4" id={AGENDA_ANCHOR}>
        <SectionTitle title={sections.agenda} />
        <Agenda />
      </Section>

      {/* 6. FAQ */}
      <Section>
        <SectionTitle title={sections.faq} subtitle={`${faq.length} dúvidas frequentes.`} />
        <Faq />
      </Section>

      {/* 7. RODAPÉ */}
      <footer className="border-t border-border bg-surface-alt px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-6 sm:flex sm:items-center sm:justify-between">
          <p className="text-lg font-bold text-foreground">{footer.brand}</p>
          <ul className="flex gap-4">
            {Object.entries(links.social).map(([name, url]) => {
              const Icon = socialIcons[name as keyof typeof socialIcons];
              const label = name.charAt(0).toUpperCase() + name.slice(1);
              return (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mx-auto mt-6 w-full max-w-5xl border-t border-border pt-6 text-sm text-muted-foreground"></div>
      </footer>
    </main>
  );
}
