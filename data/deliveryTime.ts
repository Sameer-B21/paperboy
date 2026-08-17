//the daily digest delivery time: users pick a local hour, the server stores
//the matching UTC hour so it never needs to know anyone's timezone.

export const DEFAULT_DELIVERY_HOUR = 7;

export function formatHourLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

//half-hour timezones round down to the nearest whole UTC hour, so delivery
//can be up to 30 minutes off the chosen time there.
export function localHourToUtcHour(localHour: number): number {
  const probe = new Date();
  probe.setHours(localHour, 0, 0, 0);
  return probe.getUTCHours();
}

export function utcHourToLocalHour(utcHour: number): number {
  const probe = new Date();
  probe.setUTCHours(utcHour, 0, 0, 0);
  return probe.getHours();
}
