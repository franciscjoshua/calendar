import type { EventInput } from '@fullcalendar/react'
import * as NowFns from 'temporal-polyfill/fns/Now'
import * as PlainDateFns from 'temporal-polyfill/fns/PlainDate'
import * as ZonedDateTimeFns from 'temporal-polyfill/fns/ZonedDateTime'

// Sample data written against the current week instead of fixed dates, so the calendar always
// opens on today with events around it.
//
// A date is written as a day of the week and an optional time: "4 09:30" is Thursday at 9:30,
// and "6" is Saturday as an all-day date. Day 0 is Sunday, and 7 is the Sunday after, which an
// all-day event ends on to include Saturday. "t" is today's day of the week.
//
// Weeks of events are written by hand. A lead week is laid on the current week, and a few
// lighter filler weeks take turns on the weeks around it, so a month view is full whatever week
// of the month today falls in.

/** The weeks before and after the current one that get filler weeks */
const WEEKS_AROUND = 6

/** The time of day the calendar treats as now, so the now line sits in the working day. */
const NOW_TIME = { hour: 11, minute: 20 }

/** An event whose `start` and `end` are written as days of the week, "4 09:30" */
export type WeekEventInput = Omit<EventInput, 'start' | 'end'> & { start: string; end?: string }

export interface SampleDates {
  /** The moment the calendar treats as now: today at 11:20, in epoch milliseconds */
  now: number
  /**
   * The date `when` names, in the week `week` weeks after the current one ("-1" for last
   * week), as an ISO string in the time zone: "2026-11-12T09:30:00", or "2026-11-12" alone.
   * With `offsets`, a time carries the zone's offset: "2026-11-12T09:30:00-05:00".
   */
  at: (week: number, when: string) => string
  /** The lead week on the current week and the fillers in turn around it, as events */
  layWeeks: (lead: WeekEventInput[], fillers: WeekEventInput[][]) => EventInput[]
}

export interface SampleDatesOptions {
  /**
   * Whether times carry the time zone's offset, as exact moments do: a calendar whose time
   * zone can change moves them, even onto another day.
   */
  offsets?: boolean
}

export function sampleDates(
  timeZone: string,
  { offsets = false }: SampleDatesOptions = {},
): SampleDates {
  const today = NowFns.plainDateISO(timeZone)
  const weekday = PlainDateFns.dayOfWeek(today) % 7 // Temporal's Sunday is 7
  const sunday = PlainDateFns.subtractDays(today, weekday)

  const at = (week: number, when: string) => {
    const [day, time] = when.split(' ')
    const date = PlainDateFns.addDays(sunday, week * 7 + (day === 't' ? weekday : Number(day)))
    if (!time) return PlainDateFns.toString(date)
    if (!offsets) return `${PlainDateFns.toString(date)}T${time}:00`
    const [hour, minute] = time.split(':').map(Number)
    const { year, month, day: dayOfMonth } = date
    const zoned = ZonedDateTimeFns.fromFields({
      year,
      month,
      day: dayOfMonth,
      hour,
      minute,
      timeZone,
    })
    return ZonedDateTimeFns.toString(zoned, { timeZoneName: 'never' })
  }

  const layWeeks = (lead: WeekEventInput[], fillers: WeekEventInput[][]) => {
    const events: EventInput[] = []
    for (let week = -WEEKS_AROUND; week <= WEEKS_AROUND; week++) {
      const n = fillers.length
      const items = week === 0 ? lead : fillers[(((week - 1) % n) + n) % n]
      for (const { start, end, ...rest } of items) {
        events.push({ ...rest, start: at(week, start), ...(end && { end: at(week, end) }) })
      }
    }
    return events
  }

  const { year, month, day } = today
  const now = ZonedDateTimeFns.fromFields({
    year,
    month,
    day,
    ...NOW_TIME,
    timeZone,
  }).epochMilliseconds

  return { now, at, layWeeks }
}
