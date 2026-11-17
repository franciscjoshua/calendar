import { Checkbox } from '@base-ui/react/checkbox'
import { Select } from '@base-ui/react/select'
import { joinClassNames, type CalendarController } from '@fullcalendar/react'
import { useState } from 'react'
import { DayButton, DayPicker, type DayButtonProps } from 'react-day-picker'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'
import type { TimeZoneOption } from './calendar'
import {
  CALENDARS,
  FRAME,
  MUTED,
  SLIDE,
  toDay,
  TOP_LEVEL,
  toZoned,
  type CalendarId,
} from './calendar-utils'
import { Check, Chevron, Globe, Plus } from './icons'

// Small text on a 12px line, in rem like Tailwind's own sizes
const TEXT_10 = 'text-[0.625rem]/[1.2]' // 10px

// With timeZone="UTC", each of DayPicker's dates is a day at midnight UTC
const toPickerDate = (day: PlainDateFns.Record) =>
  new Date(PlainDateFns.toZonedDateTime(day, 'UTC').epochMilliseconds)
const fromPickerDate = (date: Date) => ZonedDateTimeFns.toPlainDate(toDay(date))

// DayPicker's own button, restyled, so it keeps its keyboard focus handling
function MiniDay({ modifiers, className, ...props }: DayButtonProps) {
  return (
    <DayButton
      modifiers={modifiers}
      {...props}
      className={joinClassNames(
        'mx-auto flex size-8 items-center justify-center rounded-xl text-xs font-medium tabular-nums outline-offset-1 focus-visible:outline-2 focus-visible:outline-(--fg)',
        modifiers.today
          ? 'bg-(--primary-bg) font-semibold text-(--primary-fg) shadow-[0_2px_6px_#00000026]'
          : modifiers.selected
            ? 'bg-(--primary-bg)/12 font-semibold'
            : joinClassNames(
                'hover:bg-(--accent-bg)/80',
                modifiers.outside && 'text-(--muted-fg)/30',
              ),
      )}
    />
  )
}

const NAV_BUTTON = `flex size-7 items-center justify-center rounded-md ${MUTED} hover:bg-(--bg) hover:text-(--fg)`

export interface CalendarSidebarProps {
  /** Its padding, which the calendar decides. */
  className?: string
  controller: CalendarController
  timeZone: string
  timeZones: TimeZoneOption[]
  onTimeZoneChange: (timeZone: string) => void
  /** Today in `timeZone`. */
  today: PlainDateFns.Record
  /** The month shown, which the calendar keeps so Today can bring it back. */
  month: PlainDateFns.Record
  onMonthChange: (month: PlainDateFns.Record) => void
  shown: CalendarId[]
  onToggleCalendar: (id: CalendarId) => void
}

export function CalendarSidebar({
  className,
  controller,
  timeZone,
  timeZones,
  onTimeZoneChange,
  today,
  month,
  onMonthChange,
  shown,
  onToggleCalendar,
}: CalendarSidebarProps) {
  const [calendarsOpen, setCalendarsOpen] = useState(true)
  const date = controller.getDate()
  const current = date ? ZonedDateTimeFns.toPlainDate(toZoned(date, timeZone)) : today

  return (
    <div className={joinClassNames('flex min-h-full flex-col gap-5', className)}>
      <button
        type="button"
        className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-(--primary-bg) text-sm font-semibold text-(--primary-fg) shadow-[0_4px_12px_#0000001f] hover:opacity-90"
      >
        <Plus className="size-5" />
        Create
      </button>
      <DayPicker
        mode="single"
        required
        timeZone="UTC"
        selected={toPickerDate(current)}
        onSelect={(day) => controller.gotoDate(PlainDateFns.toString(fromPickerDate(day)))}
        month={toPickerDate(month)}
        onMonthChange={(shown) => onMonthChange(fromPickerDate(shown))}
        today={toPickerDate(today)}
        showOutsideDays
        formatters={{
          formatWeekdayName: (day) =>
            PlainDateFns.toLocaleString(fromPickerDate(day), 'en-US', { weekday: 'narrow' }),
        }}
        components={{
          Chevron: ({ orientation }) => (
            <Chevron direction={orientation === 'left' ? 'left' : 'right'} className="size-4" />
          ),
          DayButton: MiniDay,
        }}
        classNames={{
          // The arrows sit at the caption's right end
          root: 'relative',
          month_caption: 'mb-3 flex h-8 items-center',
          caption_label: 'text-sm font-semibold',
          nav: 'absolute top-0.5 right-0 z-10 flex items-center rounded-lg bg-(--muted-bg)/60 p-0.5',
          button_previous: NAV_BUTTON,
          button_next: NAV_BUTTON,
          month_grid: 'w-full border-collapse',
          weekday: `pb-1 font-semibold text-(--muted-fg)/70 uppercase ${TEXT_10}`,
          day: 'p-0 pb-1',
        }}
      />
      <div className="rounded-2xl bg-(--card-bg) p-3">
        <button
          type="button"
          aria-expanded={calendarsOpen}
          onClick={() => setCalendarsOpen(!calendarsOpen)}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          Calendars
          <Chevron
            direction="down"
            className={joinClassNames(
              `size-4 transition-transform duration-200 ${SLIDE} ${MUTED}`,
              calendarsOpen && 'rotate-180',
            )}
          />
        </button>
        {/* A grid row animates between 0fr and 1fr, which height can't do for auto content */}
        <div
          inert={!calendarsOpen}
          className={joinClassNames(
            `grid transition-[grid-template-rows,opacity] duration-200 ${SLIDE}`,
            calendarsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <ul className="grid gap-1 pt-3">
              {(Object.keys(CALENDARS) as CalendarId[]).map((id) => {
                const calendar = CALENDARS[id]
                const on = shown.includes(id)
                return (
                  <li key={id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-(--muted-bg)/60">
                      <Checkbox.Root
                        checked={on}
                        onCheckedChange={() => onToggleCalendar(id)}
                        className={joinClassNames(
                          'flex size-4 items-center justify-center rounded-[5px] border text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fg)',
                          on ? calendar.checkbox : `border-(--muted-fg)/40`,
                        )}
                      >
                        <Checkbox.Indicator>
                          <Check className="size-3" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="flex-1 truncate text-sm font-medium text-(--fg)/90">
                        {calendar.name}
                      </span>
                      <span className={`size-1.5 rounded-full ${calendar.dot}`} />
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
      {timeZones.length > 0 && (
        <div className="mt-auto rounded-2xl bg-(--card-bg) p-3">
          <Select.Root
            items={timeZones}
            value={timeZone}
            onValueChange={(chosen) => chosen && onTimeZoneChange(chosen)}
          >
            <Select.Label className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-lg bg-(--primary-bg)/10 p-1.5">
                <Globe className="size-3.5" />
              </span>
              Time zone
            </Select.Label>
            <Select.Trigger className="flex w-full items-center justify-between rounded-xl bg-(--muted-bg) py-2.5 pr-3 pl-4 text-sm hover:bg-(--accent-bg) focus-visible:outline-2 focus-visible:outline-(--fg) data-popup-open:bg-(--accent-bg)">
              <Select.Value />
              <Select.Icon>
                <Chevron direction="down" className={`size-4 ${MUTED}`} />
              </Select.Icon>
            </Select.Trigger>
            {/* The menu is rendered at the end of <body>, outside the calendar, so it takes the
                top-level class too */}
            <Select.Portal>
              <Select.Positioner
                side="top"
                sideOffset={4}
                alignItemWithTrigger={false}
                className="z-50"
              >
                <Select.Popup
                  className={`w-(--anchor-width) rounded-xl border bg-(--bg) p-1 text-(--fg) shadow-[0_8px_24px_#0000001f] outline-none ${TOP_LEVEL} ${FRAME}`}
                >
                  <Select.List>
                    {timeZones.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-(--muted-bg) data-selected:font-semibold"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      )}
    </div>
  )
}
