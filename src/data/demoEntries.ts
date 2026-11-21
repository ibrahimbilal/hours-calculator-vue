import type { AddRowPayload, TimeEntry } from '../types/calculator'
import { buildExportCsv } from '../utils/csv'

export const DEMO_HOURLY_RATE = 15

/** Sample rows across five calendar weeks (late Oct – late Nov 2026). */
export const DEMO_ENTRIES: AddRowPayload[] = [
  // Week of 27 Oct 2026
  { date: '2026-10-27', start: '08:00', end: '16:00' },
  { date: '2026-10-28', start: '09:30', end: '18:00' },
  { date: '2026-10-29', start: '10:00', end: '14:30' },
  { date: '2026-10-30', start: '22:00', end: '06:00' },
  { date: '2026-10-31', start: '07:00', end: '15:30' },
  // Week of 3 Nov 2026
  { date: '2026-11-03', start: '09:00', end: '17:00' },
  { date: '2026-11-04', start: '13:00', end: '21:00' },
  { date: '2026-11-05', start: '08:00', end: '12:00' },
  { date: '2026-11-05', start: '14:00', end: '18:00' },
  { date: '2026-11-06', start: '06:00', end: '14:00' },
  { date: '2026-11-07', start: '11:00', end: '19:30' },
  { date: '2026-11-08', start: '09:00', end: '13:00' },
  // Week of 10 Nov 2026
  { date: '2026-11-10', start: '09:00', end: '17:30' },
  { date: '2026-11-11', start: '22:00', end: '06:00' },
  { date: '2026-11-12', start: '08:00', end: '12:00' },
  { date: '2026-11-13', start: '14:00', end: '18:45' },
  { date: '2026-11-14', start: '07:30', end: '15:00' },
  { date: '2026-11-15', start: '13:00', end: '21:15' },
  { date: '2026-11-16', start: '10:00', end: '16:00' },
  // Week of 17 Nov 2026
  { date: '2026-11-17', start: '08:30', end: '17:00' },
  { date: '2026-11-18', start: '23:00', end: '07:00' },
  { date: '2026-11-19', start: '09:00', end: '17:30' },
  { date: '2026-11-20', start: '07:00', end: '11:00' },
  { date: '2026-11-21', start: '12:00', end: '20:00' },
  { date: '2026-11-22', start: '08:00', end: '16:30' },
  // Week of 24 Nov 2026
  { date: '2026-11-24', start: '09:00', end: '18:00' },
  { date: '2026-11-25', start: '10:00', end: '15:00' },
  { date: '2026-11-26', start: '22:30', end: '06:30' },
  { date: '2026-11-27', start: '08:00', end: '16:00' },
  { date: '2026-11-28', start: '13:30', end: '17:45' },
  { date: '2026-11-29', start: '07:45', end: '12:15' },
]

function toDemoRow(entry: AddRowPayload): TimeEntry {
  return {
    id: 'demo',
    date: entry.date,
    start: entry.start,
    end: entry.end,
    price: DEMO_HOURLY_RATE,
  }
}

export const DEMO_CSV_CONTENT = `${buildExportCsv(
  DEMO_ENTRIES.map(toDemoRow),
  DEMO_HOURLY_RATE,
  ['Date', 'Start', 'End', 'Duration (h)', 'Pay'],
)}\n`