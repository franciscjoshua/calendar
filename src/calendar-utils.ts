import * as InstantFns from 'temporal-polyfill/fns/Instant'

// Classes and helpers more than one of the calendar's files use

// How the sidebar and its calendars list slide open and closed
export const SLIDE = 'ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none'

// The class for what the calendar puts at the top level of the page: its top element, and what it
// renders outside it, at the end of <body>: the "+N more" popover and the time zone menu. Add here
// any class all of them need.
export const TOP_LEVEL = ''

export const FRAME = 'border-(--frame)'
export const MUTED = 'text-(--muted-fg)'

// The calendars the sidebar lists. Each is an event source with one color, which FullCalendar
// exposes to the event's classes as --fc-event-color.
export const CALENDARS = {
  work: {
    name: 'Work',
    color: '#3472d8',
    checkbox: 'border-[#3472d8] bg-[#3472d8]',
    dot: 'bg-[#3472d8]/50 dark:bg-[#3472d8]',
  },
  personal: {
    name: 'Personal',
    color: '#0c855d',
    checkbox: 'border-[#0c855d] bg-[#0c855d]',
    dot: 'bg-[#0c855d]/50 dark:bg-[#0c855d]',
  },
}

export type CalendarId = keyof typeof CALENDARS

// FullCalendar passes Date objects to its hooks, and `now` is in epoch milliseconds; read both
// as Temporal records
const toInstant = (date: Date | number) =>
  InstantFns.fromEpochMilliseconds(typeof date === 'number' ? date : date.getTime())
export const toZoned = (date: Date | number, timeZone: string) =>
  InstantFns.toZonedDateTimeISO(toInstant(date), timeZone)

// React DayPicker's dates mark a calendar date at midnight UTC, so they're read in UTC
export const toDay = (date: Date) => InstantFns.toZonedDateTimeISO(toInstant(date), 'UTC')

// Both the views' titleFormat and the toolbar's title before the views have one
export const TITLE_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
