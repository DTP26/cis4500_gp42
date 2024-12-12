export function formatDuration(sec) {
  const date = new Date(0);
  date.setSeconds(sec ?? 0);
  return date.toISOString().substring(14, 19);
}

export function formatReleaseDate(date) {
  const dateObj = new Date(Date.parse(date));
  if (isNaN(dateObj.getDate())) {
    return "Unavailable";
  }
  return dateObj.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
}