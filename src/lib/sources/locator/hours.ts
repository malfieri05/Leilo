const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAYS)[number];

export type DayWindow = { start: number; end: number };

const LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const WEEK_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function parseHoursSchedule(hours: string | null | undefined): Partial<Record<DayKey, DayWindow>> {
  const schedule: Partial<Record<DayKey, DayWindow>> = {};
  if (!hours?.trim()) return schedule;
  for (const part of hours.split("·")) {
    const match = part.trim().match(/^(sun|mon|tue|wed|thu|fri|sat)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/i);
    if (!match) continue;
    const day = match[1].toLowerCase() as DayKey;
    const start = toMinutes(match[2]);
    let end = toMinutes(match[3]);
    if (start == null || end == null) continue;
    if (end === 0) end = 24 * 60;
    if (end <= start) end += 24 * 60;
    schedule[day] = { start, end };
  }
  return schedule;
}

const NA = "N/a";

export function todayHoursSummary(hours: string | null | undefined, now = new Date()) {
  const schedule = parseHoursSchedule(hours);
  const week = weekRows(schedule);

  const day = DAYS[now.getDay()];
  const window = schedule[day];
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (!window) {
    return {
      open: null,
      headline: NA,
      week,
    };
  }

  const open = minutes >= window.start && minutes < window.end;
  if (open) {
    return {
      open: true,
      headline: `Closes ${formatMinutes(window.end)}`,
      week,
    };
  }
  if (minutes < window.start) {
    return {
      open: false,
      headline: `Opens ${formatMinutes(window.start)}`,
      week,
    };
  }
  return { open: false, headline: "Closed", week };
}

function weekRows(schedule: Partial<Record<DayKey, DayWindow>>) {
  return WEEK_ORDER.map((day) => ({
    day: LABELS[day],
    hours: schedule[day] ? formatWindow(schedule[day]) : NA,
  }));
}

function formatWindow(window: DayWindow) {
  const endMinutes = window.end >= 24 * 60 ? window.end - 24 * 60 : window.end;
  const endLabel = endMinutes === 0 ? "12:00 AM" : formatMinutes(endMinutes);
  return `${formatMinutes(window.start)}–${endLabel}`;
}

function toMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatMinutes(total: number) {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
