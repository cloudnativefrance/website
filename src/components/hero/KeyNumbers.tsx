import { useState, useEffect, useRef } from "react";
import { ui, type Locale } from "@/i18n/ui";

interface KeyNumbersProps {
  lang: Locale;
}

function useCountUp(target: number, duration: number, start: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let rafId: number;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [target, duration, start]);

  return value;
}

const stats = [
  { value: 2500, suffix: "", labelKey: "keynumbers.attendees" },
  { value: 50, suffix: "+", labelKey: "keynumbers.talks" },
  { value: 40, suffix: "+", labelKey: "keynumbers.partners" },
] as const;

export default function KeyNumbers({ lang }: KeyNumbersProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const t = (key: string) =>
    (ui[lang] as Record<string, string>)[key] ?? key;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const attendees = useCountUp(stats[0].value, 2000, visible);
  const talks = useCountUp(stats[1].value, 2000, visible);
  const partners = useCountUp(stats[2].value, 2000, visible);
  const animated = [attendees, talks, partners];

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2
        className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        {t("keynumbers.heading")}
      </h2>
      <div ref={ref} className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <div
            key={stat.labelKey}
            className="bg-card border border-border rounded-lg p-6 text-center transition-colors duration-200 hover:border-primary/50"
          >
            <span
              className="text-xl sm:text-5xl font-bold text-primary"
              style={{ lineHeight: "1.1", letterSpacing: "-0.02em" }}
            >
              {animated[i]}
            </span>
            <span className="text-xl sm:text-5xl font-bold text-destructive">
              {stat.suffix}
            </span>
            <p className="mt-2 text-base font-normal text-muted-foreground">
              {t(stat.labelKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
