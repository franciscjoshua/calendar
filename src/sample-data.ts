import type { EventInput } from '@fullcalendar/react'
import type { CalendarProps, TimeZoneOption } from './calendar'
import type { CalendarId } from './calendar-utils'
import { sampleDates, type WeekEventInput } from './sample-dates'

// The calendar's sample data: each calendar's events and the time zones it offers, laid on the
// weeks around today. SAMPLE_PROPS passes it to the calendar; pass your own data instead.

// The time zones in the menu. The calendar starts in the first.
export const TIME_ZONES: TimeZoneOption[] = [
  { value: 'America/New_York', label: 'New York' },
  { value: 'America/Los_Angeles', label: 'Los Angeles' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
]

// The events are planned in this zone, as exact moments with its offset, so choosing another
// time zone moves them on the grid. `now` is an exact moment too.
const HOME_ZONE = 'America/New_York'

const dates = sampleDates(HOME_ZONE, { offsets: true })

// An event at times, "3 10:00" being Wednesday at 10 AM and "t" today, or an all-day one from
// its first day to the day after its last (see sample-dates.ts)
const event = (title: string, start: string, end: string): WeekEventInput => ({
  title,
  start,
  end,
})
const allDay = (title: string, start: string, end: string): WeekEventInput => ({
  title,
  start,
  end,
  allDay: true,
})

// What happens every week
const WORK_ROUTINE: WeekEventInput[] = [
  ...['1', '2', '3', '4', '5'].map((day) => event('Team standup', `${day} 09:00`, `${day} 09:30`)),
  event('Client call', '2 09:00', '2 10:00'),
  event('Sprint planning', '4 09:00', '4 11:00'),
  event('Code review', '4 14:00', '4 15:30'),
]
const PERSONAL_ROUTINE: WeekEventInput[] = [
  event('Morning run', '0 09:00', '0 10:00'),
  event('Lunch with Lea', '2 13:00', '2 14:00'),
  event('Gym', '3 17:00', '3 18:00'),
  event('Brunch', '6 11:00', '6 12:30'),
]

// Each calendar's current week, and the weeks around it in turn
const WORK_THIS_WEEK: WeekEventInput[] = [
  ...WORK_ROUTINE,
  allDay('Team offsite', '1', '3'),
  event('Design review', '1 10:00', '1 11:30'),
  event('Workshop', '3 10:00', '3 13:00'),
  // A busy Thursday, for a "+N more" in the month view
  event('Product sync', '4 11:30', '4 12:30'),
  event('Interview: designer', '4 16:00', '4 17:00'),
  event('Demo day', '5 14:00', '5 16:00'),
  // Today, around the now line
  event('1:1 with Sam', 't 11:00', 't 11:45'),
  event('Focus time', 't 15:00', 't 16:30'),
]

const WORK_OTHER_WEEKS: WeekEventInput[][] = [
  [
    ...WORK_ROUTINE,
    allDay('React conference', '2', '3'),
    event('Roadmap review', '1 10:00', '1 11:30'),
    event('Offsite planning', '2 11:00', '2 12:00'),
    event('Budget review', '2 15:00', '2 16:00'),
    event('Hiring panel', '3 10:00', '3 12:00'),
    event('Retro', '5 14:00', '5 15:00'),
  ],
  [
    ...WORK_ROUTINE,
    event('Roadmap review', '1 10:00', '1 11:30'),
    event('Workshop', '3 10:00', '3 13:00'),
    // A busy Thursday, for a "+N more" in the month view
    event('Vendor demo', '4 11:30', '4 12:30'),
    event('Architecture sync', '4 16:00', '4 17:00'),
    event('Demo day', '5 14:00', '5 16:00'),
  ],
  [
    ...WORK_ROUTINE,
    allDay('Quarterly planning', '3', '5'),
    event('Roadmap review', '1 10:00', '1 11:30'),
    event('Hiring panel', '3 10:00', '3 12:00'),
    event('Board prep', '4 12:00', '4 13:00'),
    event('Retro', '5 14:00', '5 15:00'),
  ],
]

const PERSONAL_THIS_WEEK: WeekEventInput[] = [
  ...PERSONAL_ROUTINE,
  event('Dinner with Noor', '4 19:00', '4 21:00'),
]

const PERSONAL_OTHER_WEEKS: WeekEventInput[][] = [
  PERSONAL_ROUTINE,
  [...PERSONAL_ROUTINE, event('Dentist', '4 08:00', '4 08:45')],
  [...PERSONAL_ROUTINE, event('Book club', '4 19:00', '4 20:30'), allDay('Weekend away', '5', '7')],
]

export const EVENTS: Record<CalendarId, EventInput[]> = {
  work: dates.layWeeks(WORK_THIS_WEEK, WORK_OTHER_WEEKS),
  personal: [
    ...dates.layWeeks(PERSONAL_THIS_WEEK, PERSONAL_OTHER_WEEKS),
    // A trip from next Thursday into the week after
    { title: 'Flight to Tokyo', start: dates.at(1, '4'), end: dates.at(2, '1'), allDay: true },
  ],
}

// All of it, as the calendar's props, with now at 11:20 today
export const SAMPLE_PROPS = {
  eventsByCalendar: EVENTS,
  timeZones: TIME_ZONES,
  now: dates.now,
} satisfies Omit<CalendarProps, 'initialView'>
