import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Calendar } from './calendar'
import { ColorSchemeToggle } from './color-scheme-toggle'
import { SAMPLE_PROPS } from './sample-data'
import './main.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeToggle
      className="fixed top-1.5 right-1.5 z-50 flex size-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-base text-neutral-700 shadow-sm hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    />
    <Calendar
      {...SAMPLE_PROPS}
      initialView="dayGridMonth"
      className="h-dvh"
    />
  </StrictMode>,
)
