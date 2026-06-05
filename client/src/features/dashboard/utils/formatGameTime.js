export function formatGameTime(utcDate, venueTimezone) {
  if (!utcDate) return null;
  const d = new Date(utcDate);
  if (Number.isNaN(d.getTime())) return null;

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fmt = (tz, includeTZName) =>
    d.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
      ...(includeTZName && { timeZoneName: 'short' }),
    });

  const localTime = fmt(userTZ, false);
  if (!venueTimezone || userTZ === venueTimezone) return localTime;

  const venueTime = fmt(venueTimezone, true);
  return `${localTime} · ${venueTime}`;
}
