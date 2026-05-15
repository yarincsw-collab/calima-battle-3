// Tiny inline SVG icons (no external icon dep) — keeps the bundle clean.

type IconProps = { className?: string };

export const CrownIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 18h18M5 18l-2-9 5 4 4-7 4 7 5-4-2 9" />
  </svg>
);

export const StarIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.6 6.5 20.3l1.1-6.3L3 9.6l6.3-.9L12 3z" />
  </svg>
);

export const UserIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.2-3.5 4.1-5.5 7-5.5s5.8 2 7 5.5" />
  </svg>
);

export const CalimaMark = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M52 16c-6-6-14-9-22-7C18 12 10 22 10 33s8 21 20 24c8 2 16-1 22-7" />
    <path d="M40 24c-2-2-5-3-8-3-6 0-11 5-11 12s5 12 11 12c3 0 6-1 8-3" />
  </svg>
);

export const FreestyleIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M9 8l3 3 3-3M12 11v5M8 21l4-5 4 5M3 9h18" />
  </svg>
);

export const EnduranceIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 7h16M4 17h16M8 7v10M16 7v10M2 9v6M22 9v6" />
  </svg>
);

export const MapPinIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s7-7.6 7-13a7 7 0 10-14 0c0 5.4 7 13 7 13z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const CalendarIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </svg>
);

export const ArrowLeftIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 6l-6 6 6 6" />
  </svg>
);

export const CheckIcon = ({ className = "" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
