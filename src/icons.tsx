// The calendar's icons, stroked line icons. Size and color them through className.

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function Menu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function Chevron({
  direction,
  className,
}: {
  direction: 'left' | 'right' | 'up' | 'down'
  className?: string
}) {
  const path = {
    left: 'm15 18-6-6 6-6',
    right: 'm9 18 6-6-6-6',
    up: 'm18 15-6-6-6 6',
    down: 'm6 9 6 6 6-6',
  }[direction]
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} strokeWidth={3} aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

export function Globe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}

export function Clock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

// A calendar page, with a mark for each view: a grid for the month, columns for the week, a
// single block for the day
export function CalendarView({
  view,
  className,
}: {
  view: 'month' | 'week' | 'day'
  className?: string
}) {
  const marks = {
    month: 'M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01',
    week: 'M9 10v10M15 10v10',
    day: 'M8 14h8',
  }[view]
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d={`M3 10h18M8 3v4M16 3v4${marks ? ` ${marks}` : ''}`} />
    </svg>
  )
}

export function List({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...STROKE} aria-hidden="true">
      <path d="M10 6h10M10 12h10M10 18h10M4 6h1M4 12h1M4 18h1" />
    </svg>
  )
}
