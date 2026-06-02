const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]

/** Short Swedish date, e.g. "31 maj". */
export function formatSwedishShortDate(date: Date): string {
  const d = new Date(date)
  return `${d.getDate()} ${SWEDISH_MONTHS[d.getMonth()]}`
}
