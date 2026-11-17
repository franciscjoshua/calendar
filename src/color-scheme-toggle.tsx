import { useEffect, useSyncExternalStore } from 'react'

// A button for trying the calendar in light and dark mode, styled and placed by its className.
// Dark mode is a dark class on <html>, which main.css's colors follow. index.html sets it
// before the first paint, from the choice this saves or else the system's setting, and
// this switches it. It reads the class rather than keeping state of its own, so its label stays
// right whatever changes the class. In your own app, use the switch your app already has.
//
// It saves only a choice that differs from the system's setting. Choosing what the system
// already prefers removes the saved choice, so the page follows the system again, including when
// the system's setting changes later.
const STORAGE_KEY = 'color-scheme'
const html = document.documentElement
const query = matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(html, { attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // Storage may be unavailable, as in a sandboxed iframe
  }
}

export function ColorSchemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, () => html.classList.contains('dark'))

  // While no choice is saved, follow the system's setting as it changes
  useEffect(() => {
    const onChange = () => {
      if (!readSaved()) html.classList.toggle('dark', query.matches)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    html.classList.toggle('dark', next === 'dark')
    try {
      if (next === (query.matches ? 'dark' : 'light')) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The choice still holds for this visit
    }
  }

  // A moon to switch to dark mode, a sun to switch back: text symbols rather than emoji, so they
  // take the text's color
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={className}
    >
      {isDark ? '☼' : '☾'}
    </button>
  )
}
