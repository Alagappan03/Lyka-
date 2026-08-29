export function formatOccurredAt(isoString: string): {
  date: string;
  time: string;
} {
  const value = new Date(isoString);

  if (Number.isNaN(value.getTime())) {
    return { date: "-", time: "" };
  }

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);

  return { date, time };
}
