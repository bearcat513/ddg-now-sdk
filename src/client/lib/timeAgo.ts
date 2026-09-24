/**
 * "3m ago" for a stored timestamp.
 *
 * Short enough to sit in a list row's subtitle, where the exact minute never
 * matters but "is this stale?" always does. Anything older than a day is
 * counted in days rather than switching to a date, so every row in a list
 * stays the same shape and the eye can compare them without re-reading.
 */
export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
