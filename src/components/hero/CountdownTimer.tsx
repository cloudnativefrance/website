import { useState, useEffect, useRef } from "react";
import { ui, type Locale } from "@/i18n/ui";
import { getReplaysPath, TARGET_DATE } from "@/lib/cfp";

interface CountdownTimerProps {
  lang: Locale;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(): TimeLeft | null {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

export default function CountdownTimer({ lang }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft);
  const lastAriaUpdate = useRef<number>(Date.now());
  const [ariaLabel, setAriaLabel] = useState<string>("");

  const t = (key: string) =>
    (ui[lang] as Record<string, string>)[key] ?? key;

  useEffect(() => {
    const updateAriaLabel = (tl: TimeLeft | null) => {
      if (!tl) return;
      const now = Date.now();
      if (now - lastAriaUpdate.current >= 60000 || lastAriaUpdate.current === 0) {
        lastAriaUpdate.current = now;
        const tpl = t("countdown.aria_template");
        const label = tpl
          .replace("{days}", String(tl.days))
          .replace("{daysLabel}", t("countdown.days"))
          .replace("{hours}", String(tl.hours))
          .replace("{hoursLabel}", t("countdown.hours"))
          .replace("{minutes}", String(tl.minutes))
          .replace("{minutesLabel}", t("countdown.minutes"));
        setAriaLabel(label);
      }
    };

    // Set initial aria label
    const initial = calcTimeLeft();
    lastAriaUpdate.current = 0;
    updateAriaLabel(initial);

    const interval = setInterval(() => {
      const next = calcTimeLeft();
      setTimeLeft(next);
      updateAriaLabel(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [lang]);

  if (timeLeft === null) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-bold text-foreground">
          {t("hero.post_event")}
        </p>
        <a
          href={getReplaysPath(lang)}
          className="inline-flex h-[52px] items-center justify-center rounded-lg bg-primary px-8 text-lg font-bold text-primary-foreground shadow-[0_0_20px_oklch(62.5%_0.162_259.9_/_0.3)] transition-all duration-150 hover:translate-y-[-1px] hover:bg-primary/90"
        >
          {t("hero.cta.replays")}
        </a>
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-label={ariaLabel}
      className="flex w-full max-w-full flex-row items-stretch justify-center gap-2 sm:gap-4"
    >
      {UNITS.map((unit) => (
        <div
          key={unit}
          className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-border bg-card px-1 py-3 text-center sm:min-w-[72px] sm:flex-none sm:px-2"
        >
          <span
            className="block text-xl font-bold text-foreground sm:text-5xl"
            style={{ lineHeight: "1.1", letterSpacing: "-0.02em" }}
          >
            {String(timeLeft[unit]).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-[10px] font-normal uppercase tracking-wider text-muted-foreground sm:text-base sm:tracking-widest">
            {t(`countdown.${unit}`)}
          </span>
        </div>
      ))}
    </div>
  );
}
