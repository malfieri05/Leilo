import type { StoreLocation } from "@/lib/store-locations";
import { todayHoursSummary } from "@/lib/sources/locator/hours";

const BLUE = "#1a73e8";

export function doorPopupHtml(store: StoreLocation, now = new Date()) {
  const address = [store.address, [store.city, store.region].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  const website = store.website?.trim() ?? "";
  const phone = store.phone?.trim() ?? "";
  const category = store.channel?.trim() ?? "";
  const today = todayHoursSummary(store.hours, now);
  const statusColor =
    today.open === true ? "#188038" : today.open === false ? "#d93025" : "#5f6368";
  const statusWord = today.open === true ? "Open" : today.open === false ? "Closed" : "N/a";
  const statusTail =
    today.open !== null && (today.headline.startsWith("Closes") || today.headline.startsWith("Opens"))
      ? ` · ${today.headline}`
      : "";
  const week = today.week
    .map(
      (row) =>
        `<div class="door-hours-row"><span>${escapeHtml(row.day)}</span><span>${escapeHtml(row.hours)}</span></div>`,
    )
    .join("");

  const hoursBlock = `<details class="door-hours">
      <summary>
        ${clockIcon()}
        <span class="door-hours-summary-text"><span class="door-status" style="color:${statusColor}">${statusWord}</span>${escapeHtml(statusTail)}</span>
        ${chevronIcon()}
      </summary>
      <div class="door-hours-expand">
        <div class="door-hours-week">${week}</div>
      </div>
    </details>`;

  return `<div class="door-popup">
    <p class="door-popup-name">${escapeHtml(store.name)}</p>
    ${line("door-line", pinIcon(), escapeHtml(address || "—"))}
    ${website ? line("door-line--link", globeIcon(), `<a href="${escapeAttr(href(website))}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayUrl(website))}</a>`) : line("door-line", globeIcon(), "—")}
    ${phone ? line("door-line--link", phoneIcon(), `<a href="tel:${escapeAttr(phone.replace(/[^\d+]/g, ""))}">${escapeHtml(phone)}</a>`) : line("door-line", phoneIcon(), "—")}
    ${line("door-line", tagIcon(), escapeHtml(category || "—"))}
    ${hoursBlock}
  </div>`;
}

function line(className: string, icon: string, body: string) {
  return `<div class="door-line ${className}">${icon}<div class="door-line-text">${body}</div></div>`;
}

function href(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function icon(path: string) {
  return `<svg class="door-icon" width="18" height="18" viewBox="0 0 24 24" focusable="false" aria-hidden="true" style="width:18px;height:18px;max-width:18px;max-height:18px;flex:0 0 18px;display:block"><path fill="${BLUE}" d="${path}"/></svg>`;
}

function pinIcon() {
  return icon("M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z");
}

function clockIcon() {
  return icon("M12 2a10 10 0 1 0 .01 20.01A10 10 0 0 0 12 2zm1 11H7v-2h4V6h2v7z");
}

function globeIcon() {
  return icon(
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 17.93A8 8 0 0 1 4.07 13H9c.2 1.7.8 3.3 1.7 4.6.1.1.2.2.3.33zM4.07 11A8 8 0 0 1 11 4.07V9c-1.3.4-2.4 1.2-3.2 2H4.07zM13 4.07A8 8 0 0 1 19.93 11H16.2A8 8 0 0 0 13 9V4.07zM13 19.93V15c1.2-.3 2.3-1 3.2-2h3.73A8 8 0 0 1 13 19.93z",
  );
}

function phoneIcon() {
  return icon(
    "M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.57c-2.83-1.44-5.15-3.75-6.59-6.59l1.57-1.57c.27-.27.35-.68.24-1.02a10.97 10.97 0 0 1-.56-3.53C9.01 4.45 8.56 4 8.01 4H4.01c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.99c0-.55-.45-.99-1-.63z",
  );
}

function tagIcon() {
  return icon(
    "M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.41l9 9c.36.36.86.59 1.41.59.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.22-1.05-.59-1.41zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
  );
}

function chevronIcon() {
  return `<svg class="door-chevron" width="18" height="18" viewBox="0 0 24 24" focusable="false" aria-hidden="true" style="width:18px;height:18px;max-width:18px;max-height:18px;flex:0 0 18px;display:block"><path fill="#5f6368" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value);
}
