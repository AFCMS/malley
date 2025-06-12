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

/**
 * Formats a Date object into a human-readable string for post timestamps.
 *
 * @param date - The Date object to format
 * @returns A formatted string representing the time since the date, e.g., "5m", "2h", "3d", or a full date string.
 */
export function formatDatePost(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes < 1 ? "now" : `${diffInMinutes.toString()}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours.toString()}h`;
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays.toString()}d`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Sorts an array of posts by creation date, with the newest posts first.
 *
 * @param posts - Array of posts with a created_at property
 * @returns A new sorted array (does not mutate the original array)
 */
export function sortPostsByDateDesc<T extends { created_at: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Sorts an array of posts by creation date, with the oldest posts first.
 *
 * @param posts - Array of posts with a created_at property
 * @returns A new sorted array (does not mutate the original array)
 */
export function sortPostsByDateAsc<T extends { created_at: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
