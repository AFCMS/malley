const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats a Date object into a human-readable string representation.
 *
 * @param date - The Date object to format
 * @returns A formatted string in the format "Month Year" (e.g., "January 2023")
 */
export function formatDate(date: Date): string {
  return `${months[date.getMonth()]} ${date.getFullYear().toString()}`;
}
