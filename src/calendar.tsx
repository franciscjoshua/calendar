import {
  joinClassNames,
  useCalendarController,
  type CalendarOptions,
  type EventInput,
} from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import { useState } from 'react'
import * as NowFns from 'temporal-polyfill/fns/Now'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'
import { CalendarSidebar } from './calendar-sidebar'
import { CalendarToolbar } from './calendar-toolbar'
import { CALENDARS, FRAME, SLIDE, TOP_LEVEL, toZoned, type CalendarId } from './calendar-utils'
import { CalendarViews } from './calendar-views'

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]

export interface TimeZoneOption {
  /** An IANA time zone name, such as "America/New_York". */
  value: string
  /** The name shown in the menu, such as "New York". */
  label: string
}

export interface CalendarProps extends Omit<
  CalendarOptions,
  'headerToolbar' | 'footerToolbar' | 'events' | 'eventSources' | 'now' | 'height' | 'contentHeight'
> {
  /** The view to show first. */
  initialView: string
  /** Each calendar's events. The sidebar's checkboxes show and hide them. */
  eventsByCalendar?: Partial<Record<CalendarId, EventInput[]>>
  /** The time zones in the sidebar's menu. Without them, the menu is left out. */
  timeZones?: TimeZoneOption[]
  /** The time zone the calendar starts in. Defaults to the first of `timeZones`, or the viewer's own. */
  timeZone?: string
  /** The moment the calendar treats as now, in epoch milliseconds. Defaults to the real time. */
  now?: number
  /**
   * Joined onto the calendar's top element, which sets the background and the light and dark
   * palettes. It sets the height of the whole calendar, such as `h-dvh`, which the views fill. It
   * has none of its own, so pass one.
   */
  className?: string
}

// Every option not named here, such as `initialDate`, is passed to FullCalendar
export function Calendar({
  className,
  initialView,
  plugins: userPlugins = [],
  eventsByCalendar = {},
  timeZones = [],
  timeZone: initialTimeZone,
  ...restOptions
}: CalendarProps) {
  const controller = useCalendarController()
  const [timeZone, setTimeZone] = useState(
    () => initialTimeZone ?? timeZones[0]?.value ?? NowFns.timeZoneId(),
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [shown, setShown] = useState(Object.keys(CALENDARS) as CalendarId[])
  const [realNow] = useState(() => NowFns.instant().epochMilliseconds)
  const today = ZonedDateTimeFns.toPlainDate(toZoned(restOptions.now ?? realNow, timeZone))
  // The sidebar's month steps on its own, but follows the calendar's date when that changes.
  // Today brings it back even when the calendar's date doesn't change.
  const date = controller.getDate()
  const current = date ? ZonedDateTimeFns.toPlainDate(toZoned(date, timeZone)) : today
  const [month, setMonth] = useState(current)
  const [followed, setFollowed] = useState(PlainDateFns.toString(current))
  if (followed !== PlainDateFns.toString(current)) {
    setFollowed(PlainDateFns.toString(current))
    setMonth(current)
  }
  const goToToday = () => {
    controller.today()
    setMonth(today)
  }

  return (
    <div className={joinClassNames(`flex flex-col bg-(--bg) text-(--fg) ${TOP_LEVEL}`, className)}>
      <CalendarToolbar
        className="py-4 pr-5 pl-4.5"
        controller={controller}
        timeZone={timeZone}
        today={today}
        onToday={goToToday}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex min-h-0 grow">
        {/* The inner element keeps the sidebar's width as it slides shut, so its contents don't
            reflow */}
        <div
          inert={!sidebarOpen}
          className={joinClassNames(
            `relative shrink-0 overflow-hidden transition-[width,opacity] duration-300 ${SLIDE}`,
            sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0',
          )}
        >
          <div className="absolute inset-y-0 left-0 w-64 overflow-y-auto">
            <CalendarSidebar
              className="px-4 pb-4"
              controller={controller}
              timeZone={timeZone}
              timeZones={timeZones}
              onTimeZoneChange={setTimeZone}
              today={today}
              month={month}
              onMonthChange={setMonth}
              shown={shown}
              onToggleCalendar={(id) =>
                setShown(
                  shown.includes(id) ? shown.filter((other) => other !== id) : [...shown, id],
                )
              }
            />
          </div>
        </div>
        <div
          className={joinClassNames(
            `flex min-w-0 grow flex-col pr-4 pb-4 transition-[padding] duration-300 ${SLIDE}`,
            !sidebarOpen && 'pl-4',
          )}
        >
          <div
            className={`flex min-h-0 w-full grow flex-col overflow-hidden rounded-2xl border bg-(--bg) ${FRAME}`}
          >
            <CalendarViews
              className="min-h-0 grow"
              controller={controller}
              height="100%"
              initialView={initialView}
              plugins={[...plugins, ...userPlugins]}
              timeZone={timeZone}
              today={today}
              shown={shown}
              eventsByCalendar={eventsByCalendar}
              {...restOptions}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
