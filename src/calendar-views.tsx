import FullCalendar, {
  joinClassNames,
  type CalendarOptions,
  type EventInput,
  type EventSourceInput,
} from '@fullcalendar/react'
import '@fullcalendar/react/skeleton.css'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'
import {
  CALENDARS,
  FRAME,
  MUTED,
  TITLE_FORMAT,
  TOP_LEVEL,
  toZoned,
  type CalendarId,
} from './calendar-utils'
import { CalendarView, Chevron, Clock, Plus } from './icons'

// Cells and lanes get a full `border`, and FullCalendar strips the sides that would double up.
// Lines between sections, such as under the day names, are the divider hooks'.

const LINE = 'border-(--line)'

// Small text on a 12px line, in rem like Tailwind's own sizes
const TEXT_11 = 'text-[0.6875rem]/[1.090909]' // 11px
const TEXT_10 = 'text-[0.625rem]/[1.2]' // 10px
const TEXT_9 = 'text-[0.5625rem]/[1.333333]' // 9px

// Each event's fill and text, mixed from its calendar's color
const TINTED = [
  'bg-[color-mix(in_srgb,var(--fc-event-color)_14%,white)] text-[color-mix(in_srgb,var(--fc-event-color)_72%,black)]',
  'dark:bg-[color-mix(in_srgb,var(--fc-event-color)_25%,#141417)] dark:text-[color-mix(in_srgb,var(--fc-event-color)_56%,white)]',
].join(' ')

type EventsByCalendar = Partial<Record<CalendarId, EventInput[]>>

// "1h 30m"
const DURATION = new Intl.DurationFormat('en-US', { style: 'narrow' })

function formatDuration(start: Date, end: Date) {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
  return DURATION.format({ hours: Math.floor(minutes / 60), minutes: minutes % 60 })
}

// A timed event's moment, given as an ISO string with an offset or in epoch milliseconds
const toTime = (date: EventInput['start']) => new Date(date as string | number).getTime()

// How many of the shown calendars' events fall on a day. No hook gets a day's events, so this
// counts the ones the calendar is given (core/ideas/list-day-event-count.md).
function countEvents(
  day: PlainDateFns.Record,
  calendars: CalendarId[],
  eventsByCalendar: EventsByCalendar,
  timeZone: string,
) {
  const startOf = (date: PlainDateFns.Record) =>
    ZonedDateTimeFns.fromFields({ year: date.year, month: date.month, day: date.day, timeZone })
      .epochMilliseconds
  const dayStart = startOf(day)
  const dayEnd = startOf(PlainDateFns.addDays(day, 1))
  const date = PlainDateFns.toString(day)
  return calendars
    .flatMap((id) => eventsByCalendar[id] ?? [])
    .filter((event) => {
      if (event.allDay)
        return (
          String(event.start) <= date &&
          (event.end ? date < String(event.end) : date === String(event.start))
        )
      const start = toTime(event.start)
      return start < dayEnd && (event.end ? toTime(event.end) : start + 1) > dayStart
    }).length
}

// "today" and "tomorrow" in the locale's words
const RELATIVE_DAY = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

const ROW_POINTER_RESIZER = 'absolute inset-y-0 hidden w-2 group-hover:block'
const COLUMN_POINTER_RESIZER = 'absolute inset-x-0 hidden h-2 group-hover:block'
const ROW_TOUCH_RESIZER =
  'absolute top-1/2 -mt-1 size-2 rounded-full border border-(--fc-event-color) bg-(--bg)'
const COLUMN_TOUCH_RESIZER =
  'absolute left-1/2 -ml-1 size-2 rounded-full border border-(--fc-event-color) bg-(--bg)'

export interface CalendarViewsProps extends CalendarOptions {
  timeZone: string
  /** Today in `timeZone`, for the agenda's "Tomorrow". */
  today: PlainDateFns.Record
  /** The calendars whose events are shown. */
  shown: CalendarId[]
  eventsByCalendar: EventsByCalendar
}

// The options passed in come last, so they override these
export function CalendarViews({
  timeZone,
  today,
  shown,
  eventsByCalendar,
  ...options
}: CalendarViewsProps) {
  const eventSources: EventSourceInput[] = shown.map((id) => ({
    id,
    color: CALENDARS[id].color,
    events: eventsByCalendar[id] ?? [],
  }))

  return (
    <FullCalendar
      headerToolbar={false}
      titleFormat={TITLE_FORMAT}
      timeZone={timeZone}
      eventSources={eventSources}
      editable
      selectable
      dayMaxEvents
      fixedWeekCount={false}

      // Events
      eventTimeFormat={EVENT_TIME_FORMAT}
      // Below this height, eventContent's title and time don't both fit, so it puts them on one
      // line
      eventShortHeight={42}
      // A dragged event can be rendered at the end of <body>, outside the calendar, so it takes
      // the top-level class too
      eventClass={({ view, isDragging, isSelected }) =>
        view.type === 'agenda'
          ? ''
          : joinClassNames(
              TOP_LEVEL,
              isSelected
                ? joinClassNames(
                    'outline-2 outline-(--primary-bg)',
                    isDragging ? 'shadow-lg' : 'shadow-md',
                  )
                : 'focus-visible:outline-2 focus-visible:outline-(--primary-bg)',
              !isSelected && isDragging && 'opacity-75',
            )
      }
      eventContent={({ event, timeText, view, isStart, isEnd, isShort, isNarrow }) => {
        if (view.type === 'agenda')
          return (
            <AgendaItem
              event={event}
              timeText={timeText}
              allDayText={view.getOption('allDayText')}
              timeZone={timeZone}
            />
          )
        if (event.allDay || view.type === 'dayGridMonth') {
          return (
            <>
              {!isStart && <Chevron direction="left" className="size-3 shrink-0" />}
              <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                {event.title}
              </span>
              {!isEnd && <Chevron direction="right" className="size-3 shrink-0" />}
            </>
          )
        }
        return (
          <span
            className={joinClassNames(
              'flex h-full min-w-0 gap-px font-semibold',
              isShort ? 'flex-row items-center' : 'flex-col',
              isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
              isShort || isNarrow ? TEXT_11 : 'text-xs leading-tight',
            )}
          >
            <span className={isShort ? 'overflow-hidden whitespace-nowrap' : 'line-clamp-2'}>
              {event.title}
            </span>
            {!isShort && (
              <span className="overflow-hidden font-medium whitespace-nowrap tabular-nums opacity-90">
                {timeText}
              </span>
            )}
          </span>
        )
      }}

      // Block events
      // A selected event's outline replaces its border
      blockEventClass={({ isSelected }) =>
        joinClassNames(
          `group relative ${TINTED}`,
          isSelected
            ? 'border-transparent'
            : 'border-[color-mix(in_srgb,var(--fc-event-color)_30%,transparent)]',
        )
      }

      // Row events
      // A continuing event is open on that side, with no radius, border or margin
      rowEventClass={({ isStart, isEnd, isNarrow }) =>
        joinClassNames(
          'border-y',
          isNarrow ? 'mb-px' : 'mb-1',
          isStart && joinClassNames('rounded-s-lg border-s', isNarrow ? 'ms-0.5' : 'ms-1.5'),
          isEnd && joinClassNames('rounded-e-lg border-e', isNarrow ? 'me-0.5' : 'me-1.5'),
        )
      }
      rowEventInnerClass={({ isStart, isEnd, isNarrow }) =>
        joinClassNames(
          'flex min-w-0 items-center gap-0.5 font-semibold',
          isNarrow ? TEXT_11 : 'text-[0.6875rem]/4.5',
          isStart ? (isNarrow ? 'ps-1' : 'ps-1.5') : 'ps-0.5',
          isEnd ? (isNarrow ? 'pe-1' : 'pe-1.5') : 'pe-0.5',
        )
      }
      // FullCalendar only makes resize handles of the before and after elements if they have
      // classes: a strip on hover for a mouse, and a dot for touch once the event is selected
      rowEventAfterClass={({ isEndResizable, isSelected }) =>
        joinClassNames(
          isEndResizable &&
            (isSelected ? `${ROW_TOUCH_RESIZER} -end-1` : `${ROW_POINTER_RESIZER} -end-1`),
        )
      }

      // Column events
      slotEventOverlap={false}
      columnEventClass={({ isStart, isEnd }) =>
        joinClassNames(
          'border-x',
          isStart && 'rounded-t-lg border-t',
          isEnd && 'mb-px rounded-b-lg border-b',
        )
      }
      columnEventAfterClass={({ isEndResizable, isSelected }) =>
        joinClassNames(
          isEndResizable &&
            (isSelected
              ? `${COLUMN_TOUCH_RESIZER} -bottom-1`
              : `${COLUMN_POINTER_RESIZER} -bottom-1`),
        )
      }

      // More links
      rowMoreLinkClass={({ isNarrow }) =>
        joinClassNames(
          `rounded-md font-semibold ${MUTED} hover:bg-(--muted-bg) hover:text-(--fg)`,
          isNarrow ? 'mx-0.5 mb-px' : 'mx-1.5 mb-1',
        )
      }
      rowMoreLinkInnerClass={({ isNarrow }) =>
        joinClassNames(
          'whitespace-nowrap',
          isNarrow ? `px-1 py-px ${TEXT_11}` : 'px-1.5 py-0.5 text-xs',
        )
      }
      moreLinkContent={({ numericText, longText, isNarrow }) => (isNarrow ? numericText : longText)}

      // Day headers
      dayHeaderAlign="center"
      dayHeaderFormat={{ weekday: 'short' }}
      dayHeaderClass={({ inPopover }) => joinClassNames(inPopover ? 'border-b' : 'border', LINE)}
      dayHeaderInnerClass={({ inPopover, isNarrow }) =>
        inPopover ? 'px-3 py-2' : isNarrow ? 'py-1.5' : 'py-2.5'
      }
      dayHeaderContent={({
        text,
        weekdayText,
        dayNumberText,
        isToday,
        inPopover,
        isNarrow,
        view,
      }) => {
        if (inPopover) return <span className="text-sm font-semibold">{text}</span>
        const weekday = weekdayText && (
          <span className={`font-semibold tracking-wide uppercase ${MUTED} ${TEXT_11}`}>
            {weekdayText}
          </span>
        )
        if (view.type === 'dayGridMonth') return weekday
        if (view.type === 'timeGridDay') {
          return (
            <span className="flex items-center gap-3 py-1.5">
              <span className="text-lg font-semibold tracking-tight">{text}</span>
              {isToday && (
                <span className="inline-block rounded-full bg-(--primary-bg) px-2.5 py-0.5 text-xs font-semibold text-(--primary-fg) first-letter:uppercase">
                  {RELATIVE_DAY.format(0, 'day')}
                </span>
              )}
            </span>
          )
        }
        return (
          <span className="flex flex-col items-center gap-1">
            {weekday}
            {dayNumberText && (
              <span
                className={joinClassNames(
                  'flex items-center justify-center font-semibold tabular-nums',
                  isNarrow ? 'size-7 rounded-lg text-xs' : 'size-9 rounded-[10px] text-sm',
                  isToday && 'bg-(--primary-bg) text-(--primary-fg)',
                )}
              >
                {dayNumberText}
              </span>
            )}
          </span>
        )
      }}
      dayHeaderDividerClass={`border-b ${LINE}`}

      // Day cells
      dayRowClass={`border ${LINE}`}
      dayCellClass={({ isToday, view }) =>
        joinClassNames(`border ${LINE}`, isToday && view.type === 'dayGridMonth' && 'bg-(--fg)/4')
      }
      dayCellTopInnerClass={({ isToday, isOther, isNarrow }) =>
        joinClassNames(
          'flex items-center justify-center font-semibold tabular-nums',
          isNarrow ? `size-5 ${TEXT_11}` : 'size-7 text-sm',
          isToday
            ? joinClassNames(
                'bg-(--primary-bg) text-(--primary-fg)',
                isNarrow ? 'rounded-md' : 'rounded-lg',
              )
            : isOther && 'text-(--muted-fg)/30',
        )
      }
      dayCellTopContent={({ dayNumberText }) => dayNumberText}
      dayCellInnerClass={({ inPopover }) => inPopover && 'pt-2 pb-1'}
      // The Work calendar's color (CALENDARS.work.color), dimmed
      highlightClass="bg-[#3472d8]/15"

      // Popover
      popoverFormat={{ weekday: 'long', month: 'short', day: 'numeric' }}
      popoverClass={`w-64 overflow-hidden rounded-xl border bg-(--bg) text-(--fg) shadow-[0_12px_32px_#00000029] ${FRAME} ${TOP_LEVEL}`}
      popoverCloseClass={`absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-md ${MUTED} hover:bg-(--muted-bg)`}
      popoverCloseContent={() => <Plus className="size-4 rotate-45" />}

      // Lanes
      dayLaneClass={`border ${LINE}`}
      // Events are inset from the lane once, rather than each having side margins that a crowded
      // day can't afford. Their borders keep side-by-side events apart.
      dayLaneInnerClass={({ isNarrow }) => (isNarrow ? 'mx-px' : 'mx-0.5')}
      slotLaneClass={`border ${LINE}`}

      // Time slots
      slotDuration="01:00"
      snapDuration="00:15"
      slotMinHeight={48}
      scrollTime="08:30"
      slotHeaderFormat={{ hour: 'numeric' }}
      slotHeaderInnerClass={({ isFirst }) =>
        joinClassNames(
          `min-w-16 -translate-y-1/2 pr-3 pl-2 text-right font-medium text-(--muted-fg)/80 tabular-nums ${TEXT_11}`,
          isFirst && 'invisible',
        )
      }
      slotHeaderDividerClass={`border-r ${LINE}`}

      // All-day header
      // min-h fits a row with one event: views.timeGrid's top spacer, an event with its margin,
      // and the bottom spacer
      allDayHeaderClass={({ isNarrow }) =>
        joinClassNames('items-center', isNarrow ? 'min-h-7' : 'min-h-10.5')
      }
      allDayHeaderInnerClass={`my-2 min-w-16 pr-3 pl-2 text-right font-medium ${MUTED} ${TEXT_10}`}
      allDayDividerClass={`border-b ${LINE}`}

      // Now indicator
      nowIndicator
      nowIndicatorLineClass="-m-px border-1 border-(--primary-bg)"
      nowIndicatorDotClass="-m-[5px] size-0 rounded-full border-5 border-(--muted-fg) ring-2 ring-(--bg)"
      // The time is a flex child, so it centers on the line rather than sitting on a baseline
      nowIndicatorHeaderClass="flex min-w-16 -translate-y-1/2 justify-end pr-2 pl-2"
      nowIndicatorHeaderContent={({ date }) => {
        const time = toZoned(date, timeZone)
        return (
          <span
            className={`rounded-md bg-(--primary-bg) px-1.5 py-0.5 font-bold text-(--primary-fg) tabular-nums ${TEXT_10}`}
          >
            {ZonedDateTimeFns.toLocaleString(time, 'en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }).replace(/\s?[AP]M/, '')}
          </span>
        )
      }}

      // List days
      listDaysClass="mx-auto w-full max-w-2xl px-6 py-5"
      listDayClass="mb-6"
      // FullCalendar always makes the headings sticky, so static! overrides it
      // (core/bugs/list-day-header-sticky.md)
      // eslint-disable-next-line better-tailwindcss/no-restricted-classes -- see above
      listDayHeaderClass={`static! mb-3 flex items-center justify-between gap-4 border-b pb-3 ${LINE}`}
      listDayHeaderContent={({
        date,
        isToday,
        level,
        text,
        weekdayText,
        dayNumberText,
        monthText,
      }) => {
        if (level > 0) return <span className={`text-xs ${MUTED}`}>{text}</span>
        const day = ZonedDateTimeFns.toPlainDate(toZoned(date, timeZone))
        const count = countEvents(day, shown, eventsByCalendar, timeZone)
        const isTomorrow = PlainDateFns.equals(day, PlainDateFns.addDays(today, 1))
        const label =
          isToday || isTomorrow ? RELATIVE_DAY.format(isToday ? 0 : 1, 'day') : weekdayText
        return (
          <span className="flex items-center gap-4">
            <span
              className={joinClassNames(
                'flex size-12 flex-col items-center justify-center rounded-xl leading-none',
                isToday
                  ? 'bg-(--primary-bg) text-(--primary-fg) shadow-[0_4px_12px_#00000026]'
                  : 'bg-(--muted-bg)',
              )}
            >
              {dayNumberText && (
                <span className="text-xl font-bold tabular-nums">{dayNumberText}</span>
              )}
              {monthText && (
                <span className={`mt-0.5 font-semibold uppercase opacity-80 ${TEXT_9}`}>
                  {monthText}
                </span>
              )}
            </span>
            <span className="flex flex-col">
              {label && (
                <span className="text-base font-semibold first-letter:uppercase">{label}</span>
              )}
              <span className={`text-xs ${MUTED}`}>
                {count} {count === 1 ? 'event' : 'events'}
              </span>
            </span>
          </span>
        )
      }}

      // No events
      noEventsClass="flex h-full items-center justify-center"
      noEventsInnerClass="flex flex-col items-center gap-3 px-6 py-12 text-center"
      noEventsContent={() => (
        <>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-(--muted-bg)">
            <CalendarView view="month" className={`size-5 ${MUTED}`} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Nothing scheduled</span>
            <span className={`text-xs ${MUTED}`}>
              No events in these two weeks. Try another week, or show more calendars.
            </span>
          </span>
        </>
      )}

      // Table
      // Above the time grid's scrollbar: a line ends the all-day row, and the header stays open
      fillerClass={({ inTableHeader }) =>
        joinClassNames('border', inTableHeader ? 'border-transparent' : LINE)
      }

      views={{
        // A day grid's list items (a single day's timed events) are a dot and a title, while the
        // agenda's are cards
        dayGrid: {
          listItemEventClass: ({ isSelected, isNarrow }) =>
            joinClassNames(
              'items-center rounded-md',
              isNarrow ? 'mx-0.5 mb-px' : 'mx-1.5 mb-1',
              isSelected ? 'bg-(--muted-bg)' : 'hover:bg-(--muted-bg)',
            ),
          listItemEventBeforeClass: ({ isNarrow }) =>
            joinClassNames(
              'shrink-0 rounded-[3px] bg-(--fc-event-color)',
              isNarrow ? 'ms-1 size-1.5' : 'ms-1.5 size-2',
            ),
          listItemEventInnerClass: ({ isNarrow }) =>
            joinClassNames(
              'flex min-w-0 items-center font-medium text-(--fg)',
              isNarrow ? `px-1 py-px ${TEXT_11}` : 'px-1.5 py-0.5 text-xs leading-4',
            ),
        },
        dayGridMonth: {
          dayHeaderDividerClass: `border-b ${LINE}`,
          dayCellTopClass: ({ isNarrow }) =>
            joinClassNames('flex', isNarrow ? 'px-0.5 pt-0.5 pb-px' : 'px-2 pt-2 pb-1'),
          dayCellBottomClass: 'min-h-0.5',
        },
        // The all-day row: the top is only a spacer, and the bottom leaves room to click under the
        // last event. allDayHeaderClass's min-h depends on both.
        timeGrid: {
          dayCellTopClass: ({ isNarrow }) => (isNarrow ? 'min-h-px' : 'min-h-1.5'),
          dayCellBottomClass: ({ inPopover }) => (inPopover ? 'min-h-0.5' : 'min-h-3'),
        },
        timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: 'numeric' } },
        timeGridDay: {
          dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
        },
        agenda: {
          type: 'list',
          duration: { days: 14 },
          listItemEventClass: `mb-1 rounded-2xl border bg-(--bg) hover:bg-(--muted-bg)/50 ${FRAME}`,
          listItemEventBeforeClass: 'hidden',
          listItemEventTimeClass: 'hidden',
          listDayFormat: { weekday: 'long', month: 'short', day: 'numeric' },
          listDayAltFormat: false,
        },
      }}

      {...options}
    />
  )
}

// A stand-in for the start time's parts, formatted as FullCalendar formats it with
// EVENT_TIME_FORMAT, until core gives event times their parts (core/ideas/day-period-text.md)
const EVENT_TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }

function emulateStartTimeParts(date: Date, timeZone: string): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('en-US', { ...EVENT_TIME_FORMAT, timeZone }).formatToParts(
    date.getTime(),
  )
}

// Splits a time's parts into its AM/PM and the rest, standing in for the proposed
// `dayPeriodText` and `textWithoutDayPeriod` (core/ideas/day-period-text.md)
const TIME_UNITS = new Set<string>(['hour', 'minute', 'second', 'fractionalSecond'])

function splitDayPeriod(parts: Intl.DateTimeFormatPart[]) {
  const i = parts.findIndex((part) => part.type === 'dayPeriod')
  const join = (list: Intl.DateTimeFormatPart[]) => list.map((part) => part.value).join('')
  if (i < 0)
    return { dayPeriodText: '', textWithoutDayPeriod: join(parts), isDayPeriodFirst: false }
  const isDayPeriodFirst = parts.slice(i + 1).some((part) => TIME_UNITS.has(part.type))
  const before = join(parts.slice(0, i))
  const after = join(parts.slice(i + 1))
  return {
    dayPeriodText: parts[i].value,
    textWithoutDayPeriod: isDayPeriodFirst ? before + after.trimStart() : before.trimEnd() + after,
    isDayPeriodFirst,
  }
}

function AgendaItem({
  event,
  timeText,
  allDayText,
  timeZone,
}: {
  event: { title: string; allDay: boolean; start: Date | null; end: Date | null }
  timeText: string
  /** FullCalendar's allDayText, in the calendar's locale */
  allDayText: string
  timeZone: string
}) {
  const start = event.start && splitDayPeriod(emulateStartTimeParts(event.start, timeZone))
  return (
    <span className="flex min-w-0 items-start gap-4 px-5 py-4">
      <span className="flex w-12 shrink-0 flex-col items-center">
        {event.allDay || !start || !event.start || !event.end ? (
          <span
            className={`rounded-md bg-(--muted-bg) px-1.5 py-0.5 font-medium ${MUTED} ${TEXT_10}`}
          >
            {allDayText}
          </span>
        ) : (
          <>
            <span className="text-sm leading-5 font-semibold tabular-nums">
              {start.textWithoutDayPeriod}
            </span>
            {start.dayPeriodText && (
              <span className={`font-medium ${MUTED} ${TEXT_10}`}>{start.dayPeriodText}</span>
            )}
            <span className="my-1 h-3 w-px bg-(--muted-fg)/25" />
            <span className={`${MUTED} ${TEXT_10}`}>{formatDuration(event.start, event.end)}</span>
          </>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="overflow-hidden text-[0.9375rem]/5 font-semibold whitespace-nowrap">
          {event.title}
        </span>
        {timeText && (
          <span className={`flex items-center gap-1.5 text-xs ${MUTED}`}>
            <Clock className="size-3.5" />
            {timeText}
          </span>
        )}
      </span>
      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-(--fc-event-color)" />
    </span>
  )
}
