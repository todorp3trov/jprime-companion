import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://jprime.io";
const OUT_FILE = resolve("backend/src/main/resources/db/migration/V3__real_jprime_2026_data.sql");
const HALLS = ["Hall A", "Hall B", "Workshops"];
const TRACK_ORDER = new Map([
  ["Hall A", 0],
  ["Hall B", 1],
  ["Workshops", 2],
  ["Plenary", -1],
]);

const SPEAKER_SOURCE_ID_FALLBACK = new Map([
  ["Gerrit Grunwald", 5],
  ["Milen Dyankov", 9],
  ["Victor Rentea", 122],
  ["Ioannis Kolaxis", 326],
  ["Jonathan Vila Lopez", 547],
  ["Jonathan Vila López", 547],
  ["Venkat Subramaniam", 591],
  ["Marit van Dijk", 603],
  ["Stefan Angelov", 610],
  ["Ivan Yonkov", 631],
  ["Cay Horstmann", 677],
  ["Piotr Przybyl", 678],
  ["Piotr Przybył", 678],
  ["Johannes Bechberger", 686],
  ["Hinse ter Schuur", 691],
  ["Christian Heitzmann", 733],
  ["Willem Jan Glerum", 747],
  ["Marcin Chrost", 770],
  ["Vadym Kazulkin", 772],
  ["Emanuel Trandafir", 775],
  ["Arnaud Jean", 777],
  ["Panche Chavkovski", 786],
  ["Kristiyan Stoyanov", 789],
  ["Lyubomir Bozhinov", 792],
  ["Viktoriya Kutsarova", 794],
  ["Kevin Dubois", 799],
  ["Jordan Jovkov", 801],
  ["Francois Martin", 804],
  ["François Martin", 804],
  ["Thanos Stratikopoulos", 806],
  ["Sergi Almar", 807],
  ["Nayden Gochev", 810],
]);

function fetchText(url) {
  return execFileSync("curl", ["-L", "-s", "--retry", "3", "--retry-delay", "1", url], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function decodeHtml(value = "") {
  const named = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["gt", ">"],
    ["lt", "<"],
    ["nbsp", " "],
    ["quot", '"'],
  ]);

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named.get(name) ?? match);
}

function stripTags(value = "") {
  return decodeHtml(
    value
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeName(value) {
  return stripTags(value).normalize("NFC").replace(/\s+/g, " ").trim();
}

function sql(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function sqlNullableNumber(value) {
  return Number.isFinite(value) ? String(value) : "null";
}

function datePart(iso) {
  return iso.slice(0, 10);
}

function timePart(iso) {
  return iso.slice(11, 16);
}

function eventDate(iso) {
  const date = new Date(`${datePart(iso)}T12:00:00+03:00`);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Europe/Sofia" }).format(date);
  const wdShort = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Europe/Sofia" }).format(date);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Europe/Sofia",
  }).format(date);
  const shortLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Europe/Sofia",
  }).format(date);
  return { weekday, wdShort, dateLabel, shortLabel };
}

function isBreakLike(row) {
  return !row.lectorName && !row.coLectorName;
}

function kindFor(row, room) {
  if (isBreakLike(row)) {
    return "break";
  }
  return room === "Workshops" ? "workshop" : "lecture";
}

function roomFor(row, halls) {
  if (halls.length === 1) {
    return halls[0];
  }

  const title = row.title.toLowerCase();
  if (title.includes("opening") || title.includes("closing") || title.includes("raffle")) {
    return "Hall A";
  }
  return "Atrium";
}

function parseSpeakerIndex(html) {
  const found = new Map();
  const speakerCard = /<h3>\s*<a href="\/speaker\/(\d+)">([\s\S]*?)<\/a>\s*<\/h3>/g;
  for (const match of html.matchAll(speakerCard)) {
    found.set(normalizeName(match[2]), Number(match[1]));
  }
  return found;
}

function parseSpeakerDetail(html) {
  const headlineMatch = html.match(/<div class="info-text">[\s\S]*?<p>([\s\S]*?)<\/p>/);
  const bioMatch = html.match(/<div class="entry-content">([\s\S]*?)<\/div>\s*<\/div>/);
  const speakerCardMatch = html.match(/<div class="team-item[\s\S]*?<div class="info-text">/);
  const socialHtml = speakerCardMatch?.[0] ?? "";
  const xMatch = socialHtml.match(/https:\/\/x\.com\/([^"'<\s]+)/);
  const bskyMatch = socialHtml.match(/https:\/\/bsky\.app\/profile\/([^"'<\s]+)/);
  const xHandle = xMatch?.[1]?.replace(/^@/, "") ?? "";
  const bskyHandle = bskyMatch?.[1] ?? "";
  return {
    role: headlineMatch ? stripTags(headlineMatch[1]) : "",
    bio: bioMatch ? stripTags(bioMatch[1]) : "",
    handle: xHandle ? `@${xHandle}` : bskyHandle ? `@${bskyHandle}` : "",
    socialUrl: xHandle ? `https://x.com/${xHandle}` : bskyHandle ? `https://bsky.app/profile/${bskyHandle}` : "",
  };
}

function sessionSort(a, b) {
  return (
    datePart(a.startTime).localeCompare(datePart(b.startTime)) ||
    timePart(a.startTime).localeCompare(timePart(b.startTime)) ||
    (TRACK_ORDER.get(a.track) ?? 99) - (TRACK_ORDER.get(b.track) ?? 99) ||
    Number(a.id) - Number(b.id)
  );
}

function speakerNamesFrom(row) {
  return [row.lectorName, row.coLectorName].filter(Boolean).map(normalizeName);
}

const byId = new Map();
for (const hall of HALLS) {
  const url = `${BASE_URL}/pwa/findSessionsByHall?hallName=${encodeURIComponent(hall)}`;
  const rows = JSON.parse(fetchText(url));
  console.log(`${hall}: ${rows.length} rows`);

  for (const raw of rows) {
    const row = {
      id: String(raw.id),
      title: normalizeName(raw.title),
      lectorName: raw.lectorName ? normalizeName(raw.lectorName) : null,
      coLectorName: raw.coLectorName ? normalizeName(raw.coLectorName) : null,
      talkDescription: stripTags(raw.talkDescription ?? ""),
      startTime: raw.startTime,
      endTime: raw.endTime,
    };
    const existing = byId.get(row.id);
    if (existing) {
      existing.halls.push(hall);
      continue;
    }
    byId.set(row.id, { ...row, halls: [hall] });
  }
}

const speakerIndexHtml = fetchText(`${BASE_URL}/speakers`);
const speakerIndex = speakerIndexHtml.trim() ? parseSpeakerIndex(speakerIndexHtml) : new Map();
const sessions = [...byId.values()]
  .map((row) => {
    const room = roomFor(row, row.halls);
    const plenary = row.halls.length > 1 || isBreakLike(row);
    return {
      ...row,
      room,
      track: plenary ? "Plenary" : room,
      kind: kindFor(row, room),
      plenary,
      speakers: speakerNamesFrom(row),
    };
  })
  .sort(sessionSort);

const dates = [...new Set(sessions.map((session) => datePart(session.startTime)))].sort();
const dayByDate = new Map(dates.map((date, index) => [date, index + 1]));
const sortOrderByDay = new Map();

const speakerNames = [...new Set(sessions.flatMap((session) => session.speakers))].sort((a, b) => a.localeCompare(b));
const speakers = speakerNames.map((name) => {
  const sourceId = speakerIndex.get(name) ?? SPEAKER_SOURCE_ID_FALLBACK.get(name);
  const detail = sourceId ? parseSpeakerDetail(fetchText(`${BASE_URL}/speaker/${sourceId}`)) : {};
  return {
    name,
    sourceId,
    role: detail.role ?? "",
    org: "",
    location: "",
    pronoun: "",
    bio: detail.bio ?? "",
    handle: detail.handle ?? "",
    socialUrl: detail.socialUrl ?? "",
    imageUrl: sourceId ? `${BASE_URL}/image/speaker/${sourceId}` : "",
  };
});

const lines = [
  "-- Real jPrime 2026 conference data mirrored from the public PWA.",
  "-- Generated by scripts/import-jprime-data.mjs; do not hand-edit generated rows.",
  "",
  "alter table speaker add column if not exists source_id integer;",
  "alter table speaker add column if not exists image_url varchar(256) not null default '';",
  "alter table speaker add column if not exists social_url varchar(256) not null default '';",
  "",
  "delete from notification;",
  "delete from session;",
  "delete from speaker_tag;",
  "delete from speaker;",
  "delete from map_spot;",
  "delete from room;",
  "delete from conference_day;",
  "",
  "insert into conference_day (id, weekday, wd_short, date_label, short_label, calendar_date) values",
  dates
    .map((date) => {
      const id = dayByDate.get(date);
      const info = eventDate(date);
      return `  (${id}, ${sql(info.weekday)}, ${sql(info.wdShort)}, ${sql(info.dateLabel)}, ${sql(info.shortLabel)}, date ${sql(date)})`;
    })
    .join(",\n") + ";",
  "",
  "insert into room (name) values",
  ["Hall A", "Hall B", "Workshops", "Atrium"].map((room) => `  (${sql(room)})`).join(",\n") + ";",
  "",
  "insert into map_spot (name, pos_x, pos_y, kind, sort_order) values",
  [
    ["Hall A", "18%", "24%", "stage"],
    ["Hall B", "63%", "24%", "stage"],
    ["Workshops", "22%", "62%", "stage"],
    ["Atrium", "66%", "62%", "coffee"],
  ]
    .map(([name, x, y, kind], index) => `  (${sql(name)}, ${sql(x)}, ${sql(y)}, ${sql(kind)}, ${index})`)
    .join(",\n") + ";",
  "",
  "insert into speaker (name, role, org, location, pronoun, bio, handle, social_url, source_id, image_url) values",
  speakers
    .map(
      (speaker) =>
        `  (${sql(speaker.name)}, ${sql(speaker.role)}, ${sql(speaker.org)}, ${sql(speaker.location)}, ${sql(speaker.pronoun)}, ${sql(speaker.bio)}, ${sql(speaker.handle)}, ${sql(speaker.socialUrl)}, ${sqlNullableNumber(speaker.sourceId)}, ${sql(speaker.imageUrl)})`,
    )
    .join(",\n") + ";",
  "",
  "insert into session (id, day_id, start_time, end_time, title, room_id, track, level, kind, plenary, description, status, sort_order) values",
  sessions
    .map((session) => {
      const day = dayByDate.get(datePart(session.startTime));
      const sortOrder = (sortOrderByDay.get(day) ?? 0) + 1;
      sortOrderByDay.set(day, sortOrder);
      const description = session.talkDescription || session.title;
      return `  (${sql(session.id)}, ${day}, time ${sql(timePart(session.startTime))}, time ${sql(timePart(session.endTime))}, ${sql(session.title)}, (select id from room where name = ${sql(session.room)}), ${sql(session.track)}, '', ${sql(session.kind)}, ${session.plenary}, ${sql(description)}, 'upcoming', ${sortOrder})`;
    })
    .join(",\n") + ";",
  "",
  "insert into session_speaker (session_id, speaker_id, sort_order) values",
  sessions
    .flatMap((session) =>
      session.speakers.map(
        (speaker, index) =>
          `  (${sql(session.id)}, (select id from speaker where name = ${sql(speaker)}), ${index})`,
      ),
    )
    .join(",\n") + ";",
  "",
];

writeFileSync(OUT_FILE, `${lines.join("\n")}\n`);
console.log(`Wrote ${OUT_FILE}`);
console.log(`${sessions.length} unique sessions/events, ${speakers.length} scheduled speakers`);
