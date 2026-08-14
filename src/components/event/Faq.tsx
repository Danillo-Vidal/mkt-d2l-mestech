import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faq } from "@/data/event";
import { cn } from "@/lib/utils";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      {faq.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpen(expanded ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-semibold text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
              >
                <span className="min-w-0">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 text-primary transition-transform duration-200",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div id={`faq-panel-${i}`} hidden={!expanded} className="px-5 pb-5 sm:px-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
