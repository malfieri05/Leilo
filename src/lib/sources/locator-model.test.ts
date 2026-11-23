import assert from "node:assert/strict";
import test from "node:test";
import { todayHoursSummary } from "@/lib/sources/locator/hours";
import { parseLocatorSheet } from "@/lib/sources/locator/parse-locator-sheet";

test("today hours read open, closed, and the week", () => {
  const hours = "Sun 12:00-22:00 · Mon 10:00-22:00 · Tue 10:00-22:00 · Wed 10:00-22:00 · Thu 10:00-22:00 · Fri 10:00-22:00 · Sat 10:00-22:00";
  const open = todayHoursSummary(hours, new Date(2026, 10, 23, 15, 0));
  assert.equal(open.open, true);
  assert.match(open.headline, /Closes 10:00 PM/);
  assert.equal(open.week[0]?.day, "Monday");
  const closed = todayHoursSummary(hours, new Date(2026, 10, 23, 8, 0));
  assert.equal(closed.open, false);
  assert.match(closed.headline, /Opens 10:00 AM/);
});

test("missing sheet hours show N/a instead of closed", () => {
  const empty = todayHoursSummary(null);
  assert.equal(empty.open, null);
  assert.equal(empty.headline, "N/a");
  assert.ok(empty.week.every((row) => row.hours === "N/a"));

  const partial = todayHoursSummary("Mon 10:00-22:00", new Date(2026, 10, 25, 12, 0));
  assert.equal(partial.week.find((row) => row.day === "Tuesday")?.hours, "N/a");
});

test("locator sheet maps common headers and state from address", () => {
  const parsed = parseLocatorSheet([
    {
      "Store Name": "Sprouts #402",
      Address: "123 Main St, Austin, TX 78701",
      City: "Austin",
      Channel: "KEHE",
      Latitude: "30.27",
      Longitude: "-97.74",
      "Last Updated": "2026-11-01",
    },
  ]);
  assert.equal(parsed.storeLocatorDoors.length, 1);
  const door = parsed.storeLocatorDoors[0];
  assert.equal(door.name, "Sprouts #402");
  assert.equal(door.region, "TX");
  assert.equal(door.channel, "KEHE");
  assert.equal(door.lat, 30.27);
  assert.equal(door.lng, -97.74);
});

test("Leilo company sheet uses Title and Categories", () => {
  const parsed = parseLocatorSheet([
    {
      id: "KdkG7y",
      Title: "The Kava Bar",
      Address: "2296 North Center St, Hickory, NC, 28601",
      Categories: "Kava Bar",
      Website: "https://www.tucsonkavabar.com",
      Phone: "520-323-1832",
    },
    {
      id: "NWV8M9",
      Title: "Booze & Brews",
      Address: "2501 W Victory Blvd, Burbank, CA 91505",
    },
  ]);
  assert.equal(parsed.storeLocatorDoors.length, 2);
  assert.equal(parsed.storeLocatorDoors[0].city, "Hickory");
  assert.equal(parsed.storeLocatorDoors[0].region, "NC");
  assert.equal(parsed.storeLocatorDoors[0].channel, "Kava Bar");
  assert.equal(parsed.storeLocatorDoors[1].city, "Burbank");
  assert.equal(parsed.storeLocatorDoors[1].region, "CA");
  assert.equal(parsed.storeLocatorDoors[0].website, "https://www.tucsonkavabar.com");
  assert.equal(parsed.storeLocatorDoors[0].phone, "520-323-1832");
});

test("locator sheet compiles hours columns", () => {
  const parsed = parseLocatorSheet([
    {
      Title: "Sample",
      Address: "1 Main, City, TX, 75001",
      "Hours Mon": "09:00-17:00",
      "Hours Fri": "09:00-21:00",
    },
  ]);
  assert.match(parsed.storeLocatorDoors[0].hours ?? "", /Mon.*09:00-17:00/);
  assert.match(parsed.storeLocatorDoors[0].hours ?? "", /Fri.*09:00-21:00/);
});