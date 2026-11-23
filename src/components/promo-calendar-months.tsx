import {
  calendarStartMonth,
  monthName,
  parseMonthLabel,
  promoMonthPair,
  type PromoMonthRef,
  type PromoQuery,
} from "@/lib/sources/promo-model";
import type { PromoAgendaRow } from "@/lib/sources/promo-overview";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function PromoCalendarMonths({
  events,
  query,
  today = new Date(),
}: {
  events: PromoAgendaRow[];
  query: PromoQuery;
  today?: Date;
}) {
  const start = calendarStartMonth(query, today);
  const [left, right] = promoMonthPair(start.year, start.month);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MonthGrid title={`${monthName(left.month)} ${left.year}`} monthRef={left} events={events} />
      <MonthGrid title={`${monthName(right.month)} ${right.year}`} monthRef={right} events={events} />
    </div>
  );
}

function MonthGrid({
  title,
  monthRef,
  events,
}: {
  title: string;
  monthRef: PromoMonthRef;
  events: PromoAgendaRow[];
}) {
  const days = daysInMonth(monthRef.year, monthRef.month);
  const offset = new Date(monthRef.year, monthRef.month - 1, 1).getDay();
  const cells: (number | null)[] = [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, index) => index + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const undated = monthOnlyEvents(events, monthRef);
  const datedInMonth = events.filter((event) => event.startDate && touchesMonth(event, monthRef));

  return (
    <article className="rounded-[10px] border border-line bg-paper">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="font-display text-lg text-heading">{title}</h3>
        <p className="text-xs uppercase tracking-[0.12em] text-muted">
          {datedInMonth.length + undated.length} promos
        </p>
      </header>
      <div className="grid grid-cols-7 border-b border-line bg-foam/60 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-1 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-line">
        {cells.map((day, index) => (
          <DayCell
            key={`${monthRef.year}-${monthRef.month}-${index}`}
            day={day}
            events={day ? eventsOnDay(events, monthRef.year, monthRef.month, day) : []}
          />
        ))}
      </div>
      {undated.length > 0 ? (
        <div className="border-t border-line px-3 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Month window (no exact dates)</p>
          <ul className="flex flex-col gap-1.5">
            {undated.map((event) => (
              <PromoChip key={event.eventKey} event={event} />
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function DayCell({ day, events }: { day: number | null; events: PromoAgendaRow[] }) {
  if (!day) {
    return <div className="min-h-[5.5rem] bg-paper" aria-hidden />;
  }
  return (
    <div className="flex min-h-[5.5rem] flex-col gap-1 bg-paper p-1.5">
      <span className="text-[11px] font-semibold tabular-nums text-muted">{day}</span>
      <DayList events={events} />
    </div>
  );
}

function DayList({ events }: { events: PromoAgendaRow[] }) {
  if (events.length === 0) return null;
  const visible = events.slice(0, 2);
  const extra = events.length - visible.length;
  return (
    <div className="flex flex-col gap-1">
      {visible.map((event) => (
        <PromoChip key={event.eventKey} event={event} compact />
      ))}
      {extra > 0 ? <p className="text-[10px] text-muted">+{extra} more</p> : null}
    </div>
  );
}

function PromoChip({ event, compact = false }: { event: PromoAgendaRow; compact?: boolean }) {
  const tone = statusTone(event.status);
  return (
    <p
      title={`${event.account} · ${event.summary}`}
      className={`truncate rounded-[6px] border px-1.5 py-0.5 text-[10px] leading-snug ${tone} ${compact ? "max-w-full" : ""}`}
    >
      <span className="font-semibold">{event.account}</span>
      {!compact ? <span className="text-muted"> — {event.summary}</span> : null}
    </p>
  );
}

function statusTone(status: string) {
  if (status === "cancelled") return "border-line bg-cream text-muted line-through";
  if (status === "hold") return "border-hibiscus/40 bg-hibiscus/10 text-heading";
  if (status === "planned" || status === "submitted") return "border-gold/50 bg-sand/80 text-heading";
  return "border-lagoon/20 bg-foam text-heading";
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function isoDay(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventsOnDay(events: PromoAgendaRow[], year: number, month: number, day: number) {
  const iso = isoDay(year, month, day);
  return events.filter((event) => event.startDate && event.endDate && event.startDate <= iso && iso <= event.endDate);
}

function touchesMonth(event: PromoAgendaRow, monthRef: PromoMonthRef) {
  if (!event.startDate || !event.endDate) return false;
  const start = event.startDate.slice(0, 7);
  const end = event.endDate.slice(0, 7);
  const needle = `${monthRef.year}-${String(monthRef.month).padStart(2, "0")}`;
  return start <= needle && needle <= end;
}

function monthOnlyEvents(events: PromoAgendaRow[], monthRef: PromoMonthRef) {
  return events.filter((event) => {
    if (event.startDate) return false;
    const parsed = parseMonthLabel(event.monthLabel);
    return parsed?.year === monthRef.year && parsed?.month === monthRef.month;
  });
}