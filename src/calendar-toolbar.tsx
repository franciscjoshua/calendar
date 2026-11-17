import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { joinClassNames, type CalendarController } from '@fullcalendar/react'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import { FRAME, MUTED, TITLE_FORMAT } from './calendar-utils'
import { CalendarView, Chevron, List, Menu } from './icons'

const VIEWS = [
  { key: 'dayGridMonth', label: 'Month', icon: <CalendarView view="month" className="size-3.5" /> },
  { key: 'timeGridWeek', label: 'Week', icon: <CalendarView view="week" className="size-3.5" /> },
  { key: 'timeGridDay', label: 'Day', icon: <CalendarView view="day" className="size-3.5" /> },
  { key: 'agenda', label: 'Agenda', icon: <List className="size-3.5" /> },
]

export interface CalendarToolbarProps {
  /** Its padding, which the calendar decides. */
  className?: string
  controller: CalendarController
  timeZone: string
  /** Today in `timeZone`, shown until the views have a date. */
  today: PlainDateFns.Record
  /** Goes to today, in the views and the sidebar's month. */
  onToday: () => void
  onToggleSidebar: () => void
}

export function CalendarToolbar({
  className,
  controller,
  timeZone,
  today,
  onToday,
  onToggleSidebar,
}: CalendarToolbarProps) {
  const buttons = controller.getButtonState()

  return (
    <div className={joinClassNames('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className={`flex size-10 items-center justify-center rounded-xl ${MUTED} hover:bg-(--muted-bg) hover:text-(--fg)`}
      >
        <Menu className="size-5" />
      </button>
      {/* No hint as its label: for the agenda it reads just "This "
          (core/bugs/today-hint-custom-spans.md) */}
      <button
        onClick={onToday}
        className={`h-9 rounded-xl border bg-(--bg) px-5 text-sm font-medium shadow-[0_1px_2px_#0000000d] hover:bg-(--muted-bg) ${FRAME}`}
      >
        {buttons.today.text}
      </button>
      <div className="flex items-center rounded-xl bg-(--muted-bg)/60 p-0.5">
        <button
          onClick={() => controller.prev()}
          aria-label={buttons.prev.hint}
          className={`flex size-8 items-center justify-center rounded-lg ${MUTED} hover:bg-(--bg) hover:text-(--fg)`}
        >
          <Chevron direction="left" className="size-4" />
        </button>
        <button
          onClick={() => controller.next()}
          aria-label={buttons.next.hint}
          className={`flex size-8 items-center justify-center rounded-lg ${MUTED} hover:bg-(--bg) hover:text-(--fg)`}
        >
          <Chevron direction="right" className="size-4" />
        </button>
      </div>
      <h2 className="ml-5 text-xl font-semibold tracking-tight whitespace-nowrap">
        {controller.view?.title ?? PlainDateFns.toLocaleString(today, 'en-US', TITLE_FORMAT)}
      </h2>
      {/* Pressing the pressed view again doesn't unpress it */}
      <ToggleGroup
        aria-label="View"
        value={controller.view ? [controller.view.type] : []}
        onValueChange={([view]) => view && controller.changeView(view)}
        className="ml-auto flex items-center rounded-xl bg-(--muted-bg)/50 p-1"
      >
        {VIEWS.map((view) => (
          <Toggle
            key={view.key}
            value={view.key}
            className={({ pressed }) =>
              joinClassNames(
                'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-(--fg)',
                pressed
                  ? 'bg-(--bg) text-(--fg) shadow-[0_1px_2px_#0000001a]'
                  : `${MUTED} hover:text-(--fg)`,
              )
            }
          >
            {view.icon}
            {view.label}
          </Toggle>
        ))}
      </ToggleGroup>
    </div>
  )
}
