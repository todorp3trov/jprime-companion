import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import {
  ArrowLeft,
  AtSign,
  BellRing,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  FileText,
  Home,
  ImagePlus,
  Info,
  Map,
  MapPin,
  Megaphone,
  Mic,
  PenLine,
  Plus,
  Presentation,
  Star,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import "./App.css";
import {
  attachmentObjectUrl,
  deleteAttachment as apiDeleteAttachment,
  fetchDays,
  fetchMapSpots,
  fetchNotifications,
  fetchRatingCriteria,
  fetchSessions,
  fetchSpeakerProfiles,
  getNote,
  getRating,
  putNote,
  putRating,
  setSaved as apiSetSaved,
  uploadAttachment,
  type ApiAttachment,
} from "./api/conference";
import jPrimeLogo from "./assets/jprime-logo.png";

type Tab = "home" | "agenda" | "schedule" | "map";

type Kind = "keynote" | "lecture" | "workshop" | "break";
type SessionStatus = "upcoming" | "live" | "done";
type LoadState = "loading" | "ready" | "error";

type Overlay =
  | { kind: "session"; id: string }
  | { kind: "notes"; id: string }
  | { kind: "rating"; id: string }
  | { kind: "speaker"; name: string };

type Session = {
  id: string;
  day: number;
  time: string;
  end: string;
  startsAt?: string;
  endsAt?: string;
  title: string;
  speakers: string[]; // 0 for breaks/plenary; 1–3 named presenters for talks & workshops
  room: string;
  track: string;
  level: string;
  kind: Kind;
  plenary?: boolean;
  description: string;
  materials: string[];
  saved: boolean;
  status: SessionStatus;
};

type ConferenceDay = {
  id: number;
  weekday: string;
  wdShort: string;
  date: string;
  short: string;
  calendarDate?: string;
};

type AgendaSlot =
  | { kind: "plenary"; session: Session }
  | { kind: "choices"; time: string; sessions: Session[] };

type NotifKind = "reminder" | "alert" | "info";

type Notification = {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

type MapSpot = { name: string; x: string; y: string; kind: string };
type RatingCriterion = { id: number; name: string };

type SpeakerProfile = {
  id: number;
  role: string;
  org: string;
  location: string;
  pronoun: string;
  bio: string;
  tags: string[];
  handle: string;
  socialUrl?: string;
  sourceId: number | null;
  imageUrl: string;
};

let conferenceDays: ConferenceDay[] = [];
let notifications: Notification[] = [];
let mapSpots: MapSpot[] = [];
let ratingCriteria: RatingCriterion[] = [];
let speakerProfiles: Record<string, SpeakerProfile> = {};

const calendarHourHeight = 180;

const notifMeta: Record<NotifKind, { className: string; Icon: typeof Mic }> = {
  reminder: { className: "notifReminder", Icon: BellRing },
  alert: { className: "notifAlert", Icon: Megaphone },
  info: { className: "notifInfo", Icon: Info },
};

const kindMeta: Record<Kind, { label: string; className: string; Icon: typeof Mic }> = {
  keynote: { label: "Keynote", className: "kindKeynote", Icon: Mic },
  lecture: { label: "Lecture", className: "kindLecture", Icon: Presentation },
  workshop: { label: "Workshop", className: "kindWorkshop", Icon: Wrench },
  break: { label: "Break", className: "kindBreak", Icon: Coffee },
};

const locationColors = ["#6db3ff", "#f0509a", "#f5a524", "#5eead4", "#a78bfa"];
const conferenceTimeZone = "Europe/Sofia";
const wallClockTickMs = 15_000;
const conferenceDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: conferenceTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const conferenceTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: conferenceTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "0";
}

function getConferenceDateKey(date: Date) {
  const parts = conferenceDateFormatter.formatToParts(date);
  const year = partValue(parts, "year");
  const month = partValue(parts, "month");
  const day = partValue(parts, "day");
  return `${year}-${month}-${day}`;
}

function getConferenceClockMinutes(date: Date) {
  const parts = conferenceTimeFormatter.formatToParts(date);
  const hours = Number(partValue(parts, "hour"));
  const minutes = Number(partValue(parts, "minute"));
  const seconds = Number(partValue(parts, "second"));
  return hours * 60 + minutes + seconds / 60;
}

function parseTimestamp(value?: string) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getDefaultActiveDay(days: ConferenceDay[], now: Date) {
  if (!days.length) return 1;
  if (!days.some((day) => day.calendarDate)) return days[0].id;
  const today = getConferenceDateKey(now);
  const current = days.find((day) => day.calendarDate === today);
  if (current) return current.id;
  const upcoming = days.find((day) => day.calendarDate && day.calendarDate > today);
  return upcoming?.id ?? days[days.length - 1]?.id ?? 1;
}

function deriveClockStatus(session: Session, now: Date): SessionStatus {
  const start = parseTimestamp(session.startsAt);
  const end = parseTimestamp(session.endsAt);
  if (start === null || end === null) return session.status;

  const nowMs = now.getTime();
  if (nowMs < start) return "upcoming";
  if (nowMs < end) return "live";
  return "done";
}

function syncSessionsToClock(sessions: Session[], now: Date) {
  return sessions.map((session) => {
    const status = deriveClockStatus(session, now);
    return status === session.status ? session : { ...session, status };
  });
}

function isDrillableSession(session: Session | null | undefined) {
  return Boolean(session && session.kind !== "break");
}

function getSessionMetaLine(session: Session) {
  return [session.room, session.speakers.join(", ")].filter(Boolean).join(" · ");
}

function displayHandle(handle: string) {
  return handle.replace(/^@/, "");
}

function safeHttpsUrl(url?: string | null) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function socialNetworkLabel(url: string) {
  const safeUrl = safeHttpsUrl(url);
  const host = safeUrl ? new URL(safeUrl).hostname.replace(/^www\./, "") : "";
  if (host === "bsky.app") return "Bluesky";
  if (host === "x.com") return "X";
  return "social profile";
}

function deriveLocations(sessions: Session[]) {
  const locations: string[] = [];
  for (const session of sessions) {
    if (!session.plenary && session.room && !locations.includes(session.room)) {
      locations.push(session.room);
    }
  }
  return locations;
}

function locationStyle(location: string, locations: string[]): CSSProperties {
  const index = Math.max(0, locations.indexOf(location));
  return { "--location-color": locationColors[index % locationColors.length] } as CSSProperties;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number) {
  const wholeMinutes = Math.floor(totalMinutes);
  const hours = Math.floor(wholeMinutes / 60);
  const minutes = wholeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getConferenceWindow(sessions: Session[]) {
  if (!sessions.length) {
    return { start: 0, end: 60, calendarStart: 0, calendarEnd: 60, hourCount: 1 };
  }
  const start = Math.min(...sessions.map((session) => timeToMinutes(session.time)));
  const end = Math.max(...sessions.map((session) => timeToMinutes(session.end)));
  const calendarStart = Math.floor(start / 60) * 60;
  const calendarEnd = Math.ceil(end / 60) * 60;
  const hourCount = Math.max(1, (calendarEnd - calendarStart) / 60);
  return { start, end, calendarStart, calendarEnd, hourCount };
}

function getNowMinutesForDay(day: ConferenceDay | undefined, now: Date) {
  if (!day?.calendarDate || day.calendarDate !== getConferenceDateKey(now)) return null;
  return getConferenceClockMinutes(now);
}

// Outlook-style overlap layout: split mutually overlapping events into columns.
type PlacedEvent = { session: Session; column: number; columns: number };

function layoutDay(events: Session[]): PlacedEvent[] {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time) || timeToMinutes(a.end) - timeToMinutes(b.end),
  );
  const placed: PlacedEvent[] = [];
  let cluster: Session[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    const columnEnds: number[] = [];
    const columnOf: Record<string, number> = {};
    for (const event of cluster) {
      const start = timeToMinutes(event.time);
      let target = columnEnds.findIndex((endMinutes) => endMinutes <= start);
      if (target === -1) {
        target = columnEnds.length;
        columnEnds.push(0);
      }
      columnEnds[target] = timeToMinutes(event.end);
      columnOf[event.id] = target;
    }
    for (const event of cluster) {
      placed.push({ session: event, column: columnOf[event.id] ?? 0, columns: columnEnds.length });
    }
  };

  for (const event of sorted) {
    const start = timeToMinutes(event.time);
    if (cluster.length && start >= clusterEnd) {
      flushCluster();
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, timeToMinutes(event.end));
  }
  if (cluster.length) flushCluster();
  return placed;
}

function AppHeader({
  activeTab,
  overlay,
  session,
  onBack,
}: {
  activeTab: Tab;
  overlay: Overlay | null;
  session: Session | null;
  onBack: () => void;
}) {
  if (overlay) {
    const overlayCopy: Record<Overlay["kind"], { eyebrow: string; title: string }> = {
      session: { eyebrow: session ? `${kindMeta[session.kind].label} · ${session.room}` : "Session", title: "Session" },
      notes: { eyebrow: "Session", title: "Notes" },
      rating: { eyebrow: "Session", title: "Rate session" },
      speaker: { eyebrow: "Speaker", title: "Profile" },
    };
    const current = overlayCopy[overlay.kind];
    return (
      <header className="appHeader detailHeader">
        <button className="backButton" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="detailHeaderTitle">
          <p>{current.eyebrow}</p>
          <h1>{current.title}</h1>
        </div>
      </header>
    );
  }

  const titles: Record<Tab, { eyebrow: string; title: string }> = {
    home: { eyebrow: "", title: "Home" },
    agenda: { eyebrow: "", title: "Agenda" },
    schedule: { eyebrow: "", title: "My Schedule" },
    map: { eyebrow: "", title: "Halls & Booths" },
  };
  const current = titles[activeTab];

  return (
    <header className="appHeader">
      <div className="brandRow">
        <div className="brandMark">
          <img src={jPrimeLogo} alt="JPrime" />
        </div>
        {(current.eyebrow || current.title) && (
          <div className="brandText">
            {current.eyebrow && <p>{current.eyebrow}</p>}
            <h1>{current.title}</h1>
          </div>
        )}
      </div>
    </header>
  );
}

function KindChip({ kind }: { kind: Kind }) {
  const meta = kindMeta[kind];
  return (
    <span className={`kindChip ${meta.className}`}>
      <meta.Icon size={11} />
      {meta.label}
    </span>
  );
}

function LocationFilter({
  locations,
  selectedLocations,
  onToggleLocation,
  onClearLocations,
}: {
  locations: string[];
  selectedLocations: string[];
  onToggleLocation: (location: string) => void;
  onClearLocations: () => void;
}) {
  if (!locations.length) return null;
  const selected = new Set(selectedLocations.filter((location) => locations.includes(location)));
  const allActive = selected.size === 0;

  return (
    <div className="locationFilter" aria-label="Agenda location filter">
      <button
        className={`locationChip all ${allActive ? "active" : ""}`}
        onClick={onClearLocations}
        aria-pressed={allActive}
      >
        All
      </button>
      {locations.map((location) => (
        <button
          key={location}
          className={`locationChip ${selected.has(location) ? "active" : ""}`}
          style={locationStyle(location, locations)}
          onClick={() => onToggleLocation(location)}
          aria-pressed={selected.has(location)}
        >
          <span className="locationChipDot" />
          {location}
        </button>
      ))}
    </div>
  );
}

function AgendaSessionRow({
  session,
  locations,
  onOpen,
  onToggleSave,
}: {
  session: Session;
  locations: string[];
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  const speakerLine = session.speakers.join(", ");
  const interactive = isDrillableSession(session);
  const mainContent = (
    <>
      <span className="sessionTopline">
        <KindChip kind={session.kind} />
        <span className={`statusChip ${session.status}`}>{session.status}</span>
        <span className="agendaSessionTime">
          <Clock size={11} />
          {session.time}–{session.end}
        </span>
      </span>
      <strong>{session.title}</strong>
      {[speakerLine, session.level].filter(Boolean).length ? (
        <small>{[speakerLine, session.level].filter(Boolean).join(" · ")}</small>
      ) : null}
    </>
  );

  return (
    <article
      className={`agendaSessionRow ${kindMeta[session.kind].className} ${interactive ? "" : "static"}`}
      style={locationStyle(session.room, locations)}
    >
      <div className="agendaLocationRail">
        <span>{session.room}</span>
      </div>
      {interactive ? (
        <button className="agendaSessionMain" onClick={onOpen}>
          {mainContent}
        </button>
      ) : (
        <div className="agendaSessionMain static">{mainContent}</div>
      )}
      {interactive ? (
        <button
          className={`agendaSaveButton ${session.saved ? "saved" : ""}`}
          onClick={onToggleSave}
          aria-label={session.saved ? `Remove ${session.title} from schedule` : `Add ${session.title} to schedule`}
          aria-pressed={session.saved}
          title={session.saved ? "Remove from schedule" : "Add to schedule"}
        >
          {session.saved ? <Check size={14} /> : <Plus size={14} />}
        </button>
      ) : null}
    </article>
  );
}

function AgendaEmptyLocationRow({ location, locations }: { location: string; locations: string[] }) {
  return (
    <div className="agendaEmptyLocationRow" style={locationStyle(location, locations)}>
      <div className="agendaLocationRail">
        <span>{location}</span>
      </div>
      <div className="agendaEmptyCopy">
        <strong>No session</strong>
      </div>
    </div>
  );
}

function PlenaryBand({ session, onOpen }: { session: Session; onOpen?: () => void }) {
  const meta = kindMeta[session.kind];
  const content = (
    <>
      <span className="plenaryIcon">
        <meta.Icon size={16} />
      </span>
      <span className="plenaryText">
        <strong>{session.title}</strong>
        <small>
          {session.time}–{session.end} · {session.room}
        </small>
      </span>
      {onOpen ? <ChevronRight size={16} /> : <span className="plenaryTag">{meta.label}</span>}
    </>
  );
  return onOpen ? (
    <button className={`plenaryBand ${meta.className}`} onClick={onOpen}>
      {content}
    </button>
  ) : (
    <div className={`plenaryBand static ${meta.className}`}>{content}</div>
  );
}

function StatePanel({
  title,
  body,
  tone = "empty",
}: {
  title: string;
  body: string;
  tone?: "empty" | "loading" | "error";
}) {
  return (
    <div className={`statePanel ${tone}`}>
      <span className="stateIcon">{tone === "loading" ? <Clock size={18} /> : <Info size={18} />}</span>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
  );
}

function ConferenceLoadState({ state, error }: { state: Exclude<LoadState, "ready">; error: string | null }) {
  const isError = state === "error";
  return (
    <section className="screenStack">
      <StatePanel
        tone={isError ? "error" : "loading"}
        title={isError ? "Conference data unavailable" : "Loading conference data"}
        body={isError ? error ?? "The app could not reach the conference API." : "Fetching the latest schedule."}
      />
    </section>
  );
}

function NotificationFeed() {
  const unread = notifications.filter((notification) => notification.unread).length;
  return (
    <div className="notifFeed">
      <div className="notifHead">
        <h3>
          <BellRing size={15} />
          Notifications
        </h3>
        {unread ? <span className="notifCount">{unread} new</span> : null}
      </div>
      <div className="notifList">
        {notifications.map((notification) => {
          const meta = notifMeta[notification.kind];
          return (
            <div
              className={`notifCard ${meta.className} ${notification.unread ? "unread" : ""}`}
              key={notification.id}
            >
              <span className="notifIcon">
                <meta.Icon size={15} />
              </span>
              <div className="notifBody">
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
              </div>
              <span className="notifTime">{notification.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HomeScreen({
  sessions,
  onOpenSession,
}: {
  sessions: Session[];
  onOpenSession: (id: string) => void;
}) {
  const liveSessions = sessions.filter((session) => session.status === "live");
  const hasMultipleLiveSessions = liveSessions.length > 1;
  const next = sessions.find((session) => session.status === "upcoming");
  const featured = liveSessions[0] ?? next ?? sessions[sessions.length - 1];
  const heroState: SessionStatus = liveSessions.length ? "live" : next ? "upcoming" : "done";
  const heroLabel =
    heroState === "live"
      ? hasMultipleLiveSessions
        ? `${liveSessions.length} sessions running`
        : "Now running"
      : heroState === "upcoming"
        ? "Next up"
        : "Conference complete";
  const upcoming = sessions
    .filter((session) => session.status === "upcoming" && session.id !== featured?.id)
    .slice(0, 3);
  const featuredCanOpen = isDrillableSession(featured);
  const liveRooms = Array.from(new Set(liveSessions.map((session) => session.room).filter(Boolean)));
  const liveRoomCount = liveRooms.length || liveSessions.length;

  if (!featured) {
    return (
      <section className="screenStack">
        <NotificationFeed />
        <StatePanel title="No sessions available" body="The conference API returned no sessions." />
      </section>
    );
  }

  return (
    <section className="screenStack">
      <NotificationFeed />

      <div className={`heroPanel ${hasMultipleLiveSessions ? "multiLive" : ""}`}>
        <div>
          <p className={`sectionLabel liveLabel ${heroState}`}>
            {heroState === "live" ? <span className="livePulse" /> : heroState === "upcoming" ? <Clock size={11} /> : <Check size={11} />}
            {heroLabel}
          </p>
          {hasMultipleLiveSessions ? (
            <>
              <h2>
                Now running across {liveRoomCount} {liveRoomCount === 1 ? "room" : "rooms"}
              </h2>
              <div className="heroLiveList">
                {liveSessions.map((session) => {
                  const meta = getSessionMetaLine(session);
                  const content = (
                    <>
                      <span className="heroLiveTime">
                        <Clock size={12} />
                        {session.time}–{session.end}
                      </span>
                      <strong>{session.title}</strong>
                      {meta ? <small>{meta}</small> : null}
                      {isDrillableSession(session) ? <ChevronRight className="heroLiveArrow" size={15} /> : null}
                    </>
                  );
                  return isDrillableSession(session) ? (
                    <button className="heroLiveItem" key={session.id} onClick={() => onOpenSession(session.id)}>
                      {content}
                    </button>
                  ) : (
                    <div className="heroLiveItem static" key={session.id}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2>{featured.title}</h2>
              <p>{getSessionMetaLine(featured)}</p>
              <span className="heroTime">
                <Clock size={12} />
                {featured.time}–{featured.end}
              </span>
            </>
          )}
        </div>
        {!hasMultipleLiveSessions && featuredCanOpen ? (
          <button className="primaryButton" onClick={() => onOpenSession(featured.id)}>
            Open <ChevronRight size={16} />
          </button>
        ) : null}
      </div>

      <div className="sectionHeader">
        <h3>Coming up</h3>
      </div>
      {upcoming.length ? (
        <div className="compactList">
          {upcoming.map((session) => {
            const content = (
              <>
                <span>{session.time}</span>
                <strong>{session.title}</strong>
                <small>{session.room}</small>
              </>
            );
            return isDrillableSession(session) ? (
              <button className="miniSession" key={session.id} onClick={() => onOpenSession(session.id)}>
                {content}
              </button>
            ) : (
              <div className="miniSession static" key={session.id}>
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <StatePanel title="No upcoming sessions" body="The remaining agenda has wrapped for now." />
      )}
    </section>
  );
}

function DayTabs({
  days,
  activeDay,
  onSelect,
}: {
  days: ConferenceDay[];
  activeDay: number;
  onSelect: (day: number) => void;
}) {
  return (
    <div className="dayTabs" role="tablist" aria-label="Conference day">
      {days.map((day) => (
        <button
          key={day.id}
          role="tab"
          aria-selected={activeDay === day.id}
          className={`dayTab ${activeDay === day.id ? "active" : ""}`}
          onClick={() => onSelect(day.id)}
        >
          <span className="dayTabName">{day.short}</span>
        </button>
      ))}
    </div>
  );
}

function AgendaScreen({
  sessions,
  activeDay,
  locations,
  selectedLocations,
  onSelectDay,
  onOpenSession,
  onToggleSave,
  onToggleLocation,
  onClearLocations,
}: {
  sessions: Session[];
  activeDay: number;
  locations: string[];
  selectedLocations: string[];
  onSelectDay: (day: number) => void;
  onOpenSession: (id: string) => void;
  onToggleSave: (id: string) => void;
  onToggleLocation: (location: string) => void;
  onClearLocations: () => void;
}) {
  const daySessions = sessions.filter((session) => session.day === activeDay);
  const selectedLocationSet = new Set(selectedLocations.filter((location) => locations.includes(location)));
  const visibleLocations = selectedLocationSet.size
    ? locations.filter((location) => selectedLocationSet.has(location))
    : locations;
  const slots: AgendaSlot[] = [];

  for (const session of daySessions) {
    if (session.plenary) {
      slots.push({ kind: "plenary", session });
      continue;
    }

    let slot = slots.find((candidate): candidate is Extract<AgendaSlot, { kind: "choices" }> =>
      candidate.kind === "choices" && candidate.time === session.time,
    );
    if (!slot) {
      slot = { kind: "choices", time: session.time, sessions: [] };
      slots.push(slot);
    }
    slot.sessions.push(session);
  }

  return (
    <section className="screenStack">
      <DayTabs days={conferenceDays} activeDay={activeDay} onSelect={onSelectDay} />
      <LocationFilter
        locations={locations}
        selectedLocations={selectedLocations}
        onToggleLocation={onToggleLocation}
        onClearLocations={onClearLocations}
      />
      <div className="agendaGrid">
        {slots.length ? slots.map((slot) => {
          if (slot.kind === "plenary") {
            return (
              <section className="agendaSlot plenarySlot" key={slot.session.id}>
                <div className="slotTime">
                  <strong>{slot.session.time}</strong>
                  <span>{slot.session.end}</span>
                </div>
                <PlenaryBand
                  session={slot.session}
                  onOpen={isDrillableSession(slot.session) ? () => onOpenSession(slot.session.id) : undefined}
                />
              </section>
            );
          }

          const sessionsByLocation = new globalThis.Map(slot.sessions.map((session) => [session.room, session]));
          const hasVisibleSession = visibleLocations.some((location) => sessionsByLocation.has(location));
          if (!hasVisibleSession) return null;

          return (
            <section className="agendaSlot agendaChoiceSlot" key={`choices-${slot.time}`}>
              <div className="slotTime">
                <strong>{slot.time}</strong>
              </div>
              <div className="agendaChoiceRows">
                {visibleLocations.map((location) => {
                  const session = sessionsByLocation.get(location);
                  return session ? (
                    <AgendaSessionRow
                      key={session.id}
                      session={session}
                      locations={locations}
                      onOpen={() => onOpenSession(session.id)}
                      onToggleSave={() => onToggleSave(session.id)}
                    />
                  ) : (
                    <AgendaEmptyLocationRow key={`empty-${slot.time}-${location}`} location={location} locations={locations} />
                  );
                })}
              </div>
            </section>
          );
        }) : (
          <StatePanel title="No sessions for this day" body="The conference API returned no agenda items for the selected day." />
        )}
      </div>
    </section>
  );
}

function ScheduleScreen({
  sessions,
  activeDay,
  now,
  onSelectDay,
  onOpenSession,
}: {
  sessions: Session[];
  activeDay: number;
  now: Date;
  onSelectDay: (day: number) => void;
  onOpenSession: (id: string) => void;
}) {
  const day = conferenceDays.find((candidate) => candidate.id === activeDay) ?? conferenceDays[0];
  const daySessions = sessions.filter((session) => session.day === activeDay);
  const dayEvents = daySessions.filter((session) => session.plenary || session.saved);
  const savedCount = daySessions.filter((session) => session.saved && !session.plenary).length;
  if (!day) {
    return (
      <section className="screenStack scheduleScreen">
        <StatePanel title="No conference days" body="The conference API returned no day records." />
      </section>
    );
  }
  if (!dayEvents.length) {
    return (
      <section className="screenStack scheduleScreen">
        <DayTabs days={conferenceDays} activeDay={activeDay} onSelect={onSelectDay} />
        <div className="calHeaderRow">
          <div className="calDate">
            <strong>{day.weekday}</strong>
            <span>{day.date}</span>
          </div>
        </div>
        <StatePanel title="No saved sessions" body="No plenary or saved sessions were returned for this day." />
      </section>
    );
  }
  const placed = layoutDay(dayEvents);
  const dayWindow = getConferenceWindow(dayEvents);
  const calendarHeight = dayWindow.hourCount * calendarHourHeight;
  const range = dayWindow.calendarEnd - dayWindow.calendarStart;
  const toTop = (minutes: number) => `${((minutes - dayWindow.calendarStart) / range) * 100}%`;
  const toHeight = (minutes: number) => `${(minutes / range) * 100}%`;
  const hourLines = Array.from({ length: dayWindow.hourCount + 1 }, (_, index) => dayWindow.calendarStart + index * 60);
  const clockMinutes = getNowMinutesForDay(day, now);
  const nowMinutes =
    clockMinutes !== null && clockMinutes >= dayWindow.calendarStart && clockMinutes <= dayWindow.calendarEnd
      ? clockMinutes
      : null;
  const columnGap = 6;
  const eventGap = 6;

  return (
    <section className="screenStack scheduleScreen">
      <DayTabs days={conferenceDays} activeDay={activeDay} onSelect={onSelectDay} />
      <div className="calHeaderRow">
        <div className="calDate">
          <strong>{day.weekday}</strong>
          <span>{day.date}</span>
        </div>
        {clockMinutes !== null ? (
          <span className="calNowChip">
            <Clock size={13} /> Now {formatMinutes(clockMinutes)}
          </span>
        ) : null}
      </div>

      <div className="calLegend" aria-hidden="true">
        {(Object.keys(kindMeta) as Kind[]).map((kind) => (
          <span className={`calLegendItem ${kindMeta[kind].className}`} key={kind}>
            <i />
            {kindMeta[kind].label}
          </span>
        ))}
      </div>

      <div className="calShell">
        <div className="calBody" style={{ height: calendarHeight }}>
          <div className="calGutter" aria-hidden="true">
            {hourLines.map((line, index) => (
              <span
                className={`calHourLabel ${index === 0 ? "start" : ""} ${index === hourLines.length - 1 ? "end" : ""}`}
                key={line}
                style={{ top: toTop(line) }}
              >
                {formatMinutes(line)}
              </span>
            ))}
          </div>
          <div className="calCanvas">
            {hourLines.map((line) => (
              <span className="calHourLine" key={line} style={{ top: toTop(line) }} />
            ))}
            {hourLines.slice(0, -1).map((line) => (
              <span className="calHalfLine" key={`half-${line}`} style={{ top: toTop(line + 30) }} />
            ))}

            {placed.map(({ session, column, columns }) => {
              const meta = kindMeta[session.kind];
              const widthPct = 100 / columns;
              const interactive = isDrillableSession(session);
              const durationMin = timeToMinutes(session.end) - timeToMinutes(session.time);
              const isShortBreak = session.kind === "break" && durationMin <= 20;
              const showRoom = durationMin >= 40;
              return (
                <article
                  className={`calEvent ${meta.className} ${session.status} ${interactive ? "" : "static"} ${isShortBreak ? "shortBreak" : ""}`}
                  key={session.id}
                  style={{
                    top: `calc(${toTop(timeToMinutes(session.time))} + ${eventGap / 2}px)`,
                    height: `calc(${toHeight(durationMin)} - ${eventGap}px)`,
                    minHeight: isShortBreak ? 34 : 30,
                    left: `calc(${widthPct * column}% + ${column === 0 ? 0 : columnGap / 2}px)`,
                    width: `calc(${widthPct}% - ${columns === 1 ? 0 : columnGap}px)`,
                  }}
                >
                  {interactive ? (
                    <button className="calEventOpen" onClick={() => onOpenSession(session.id)}>
                      <span className="calEventTime">
                        <meta.Icon size={11} />
                        {session.time}–{session.end}
                      </span>
                      <strong>{session.title}</strong>
                      {showRoom ? <small>{session.room}</small> : null}
                    </button>
                  ) : (
                    <div className="calEventOpen">
                      <span className="calEventTime">
                        <meta.Icon size={11} />
                        {session.time}–{session.end}
                      </span>
                      <strong>{session.title}</strong>
                      {showRoom ? <small>{session.room}</small> : null}
                    </div>
                  )}
                </article>
              );
            })}

            {nowMinutes !== null ? (
              <div className="calNowLine" style={{ top: toTop(nowMinutes) }}>
                <span className="calNowDot" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {savedCount === 0 ? (
        <div className="calHint">
          <Plus size={15} />
          <span>Browse the Agenda and save sessions to fill your day.</span>
        </div>
      ) : null}
    </section>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "JP"
  );
}

function SpeakerAvatar({ name, imageUrl, className }: { name: string; imageUrl?: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className={className}>
      {showImage ? (
        <img src={imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

function SessionDetail({
  session,
  onNotes,
  onRating,
  onToggleSave,
  onOpenSpeaker,
}: {
  session: Session;
  onNotes: () => void;
  onRating: () => void;
  onToggleSave: () => void;
  onOpenSpeaker: (name: string) => void;
}) {
  return (
    <section className="screenStack detailView">
      <div className={`detailHero ${kindMeta[session.kind].className}`}>
        <button
          className={`detailSave ${session.saved ? "saved" : ""}`}
          onClick={onToggleSave}
          aria-label={session.saved ? `Remove ${session.title} from schedule` : `Add ${session.title} to schedule`}
          aria-pressed={session.saved}
        >
          {session.saved ? <Check size={15} /> : <Plus size={15} />} {session.saved ? "Saved" : "Save"}
        </button>
        <div className="detailHeroTop">
          <KindChip kind={session.kind} />
          <span className={`statusChip ${session.status}`}>{session.status}</span>
        </div>
        <h2>{session.title}</h2>
        <p>{session.description}</p>
        {session.speakers.length ? (
          <div className="speakerList">
            {session.speakers.map((name) => {
              const profile = speakerProfiles[name];
              if (profile) {
                const speakerLine = [profile.role, profile.org, session.room].filter(Boolean).join(" · ");
                return (
                  <button
                    key={name}
                    className="speakerLine speakerLink"
                    onClick={() => onOpenSpeaker(name)}
                    aria-label={`View profile for ${name}`}
                  >
                    <SpeakerAvatar name={name} imageUrl={profile.imageUrl} className="avatar" />
                    <div>
                      <strong>{name}</strong>
                      <span>{speakerLine || [session.level, session.room].filter(Boolean).join(" · ")}</span>
                    </div>
                    <span className="speakerCue">
                      Profile <ChevronRight size={14} />
                    </span>
                  </button>
                );
              }
              return (
                <div className="speakerLine" key={name}>
                  <SpeakerAvatar name={name} className="avatar" />
                  <div>
                    <strong>{name}</strong>
                    <span>{[session.level, session.room].filter(Boolean).join(" · ")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="speakerLine">
            <SpeakerAvatar name="JPrime program" className="avatar" />
            <div>
              <strong>JPrime program</strong>
              <span>
                {[session.level, session.room, `${session.time}–${session.end}`].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="actionRow">
        <button onClick={onNotes}>
          <PenLine size={17} /> Notes
        </button>
        <button onClick={onRating}>
          <Star size={17} /> Rate
        </button>
      </div>
      <div className="materialsPanel">
        <h3>Materials</h3>
        {session.materials.length ? (
          session.materials.map((material) => (
            <div className="materialRow" key={material}>
              <FileText size={16} />
              <span>{material}</span>
            </div>
          ))
        ) : (
          <div className="materialEmpty">
            <FileText size={16} />
            <span>No materials yet.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function SpeakerScreen({
  name,
  sessions,
}: {
  name: string;
  sessions: Session[];
}) {
  const profile = speakerProfiles[name];
  const talks = sessions.filter((session) => session.speakers.includes(name));

  if (!profile) return null;

  const roleParts = [profile.role, profile.org].filter(Boolean);
  const socialUrl = safeHttpsUrl(profile.socialUrl);
  const metaItems = [
    profile.location ? (
      <span key="location">
        <MapPin size={12} aria-hidden="true" /> {profile.location}
      </span>
    ) : null,
    profile.pronoun ? <span key="pronoun">{profile.pronoun}</span> : null,
    profile.handle && socialUrl ? (
      <a
        className="speakerHandle"
        href={socialUrl}
        key="handle"
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${socialNetworkLabel(socialUrl)} profile for ${name}`}
      >
        <AtSign size={12} aria-hidden="true" />
        {displayHandle(profile.handle)}
      </a>
    ) : profile.handle ? (
      <span className="speakerHandle" key="handle">
        <AtSign size={12} aria-hidden="true" />
        {displayHandle(profile.handle)}
      </span>
    ) : null,
  ].filter(Boolean);

  return (
    <section className="screenStack speakerView">
      <div className="speakerHero">
        <span className="speakerBracket left" aria-hidden="true">{"{"}</span>
        <span className="speakerBracket right" aria-hidden="true">{"}"}</span>
        <div className="speakerPortrait">
          <span className="speakerRing" aria-hidden="true" />
          <SpeakerAvatar name={name} imageUrl={profile.imageUrl} className="speakerInitials" />
        </div>
        <h2>{name}</h2>
        {roleParts.length ? <p className="speakerRole">{roleParts.join(" · ")}</p> : null}
        {metaItems.length ? <div className="speakerMeta">{metaItems}</div> : null}
      </div>

      {profile.bio ? (
        <div className="speakerBio">
          <span className="speakerKicker">About</span>
          <p>{profile.bio}</p>
        </div>
      ) : null}

      {profile.tags.length ? (
        <div className="speakerTags">
          {profile.tags.map((tag) => (
            <span className="speakerTag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="speakerTalks">
        <div className="speakerTalksHead">
          <span className="speakerKicker">At jPrime</span>
          <strong>{talks.length}</strong>
        </div>
        {talks.map((talk) => (
          <div className="speakerTalk" key={talk.id}>
            <span className="speakerTalkTime">
              <em>{conferenceDays.find((d) => d.id === talk.day)?.short}</em>
              {talk.time}
            </span>
            <span className="speakerTalkBody">
              <strong>{talk.title}</strong>
              <small>
                {talk.room} · {talk.track}
              </small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function VenueMapScreen() {
  return (
    <section className="screenStack">
      <div className="mapPanel">
        <div className="mapGrid" />
        {mapSpots.length ? (
          mapSpots.map((spot) => (
            <div className={`mapPin ${spot.kind}`} style={{ left: spot.x, top: spot.y }} key={spot.name}>
              <span />
              <strong>{spot.name}</strong>
            </div>
          ))
        ) : (
          <div className="mapEmpty">
            <Info size={18} />
            <span>No map spots returned.</span>
          </div>
        )}
      </div>
      <div className="legendGrid">
        <div>
          <span className="legendDot red" /> Talk halls
        </div>
        <div>
          <span className="legendDot green" /> Sponsor booths
        </div>
        <div>
          <span className="legendDot yellow" /> Coffee & food
        </div>
      </div>
      <div className="roomList">
        <button>
          <Map size={16} /> Hall A to Booth 09 <span>2 min</span>
        </button>
        <button>
          <Map size={16} /> Entrance to Workshop 1 <span>4 min</span>
        </button>
        <button>
          <Map size={16} /> Hall C to Atrium lunch <span>3 min</span>
        </button>
      </div>
    </section>
  );
}

type AttachmentKind = ApiAttachment["kind"];

const attachmentKinds: AttachmentKind[] = ["whiteboard", "slide", "badge"];
const attachmentLabels: Record<AttachmentKind, string> = {
  whiteboard: "Architecture sketch",
  slide: "Speaker slide",
  badge: "Conference badge",
};

function NotesScreen({ session }: { session: Session }) {
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [savedTick, setSavedTick] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const urlsRef = useRef<Record<number, string>>({});
  urlsRef.current = urls;

  const loadUrl = (id: number) => {
    attachmentObjectUrl(id)
      .then((url) => setUrls((current) => ({ ...current, [id]: url })))
      .catch((error) => console.error("Could not load photo.", error));
  };

  useEffect(() => {
    let cancelled = false;
    getNote(session.id)
      .then((note) => {
        if (cancelled) return;
        setBody(note.body);
        setAttachments(note.attachments);
        note.attachments.forEach((att) => loadUrl(att.id));
      })
      .catch((error) => console.error("Could not load notes.", error));
    return () => {
      cancelled = true;
      Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const saveBody = () => {
    putNote(session.id, body)
      .then(() => {
        setSavedTick(true);
        window.setTimeout(() => setSavedTick(false), 1500);
      })
      .catch((error) => console.error("Could not save note.", error));
  };

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const kind = attachmentKinds[attachments.length % attachmentKinds.length];
    uploadAttachment(session.id, file, kind, attachmentLabels[kind])
      .then((att) => {
        setAttachments((current) => [...current, att]);
        loadUrl(att.id);
      })
      .catch((error) => console.error("Could not upload photo.", error));
  };

  const removePhoto = (id: number) => {
    apiDeleteAttachment(id)
      .then(() => {
        setAttachments((current) => current.filter((item) => item.id !== id));
        setUrls((current) => {
          const next = { ...current };
          if (next[id]) URL.revokeObjectURL(next[id]);
          delete next[id];
          return next;
        });
        setPreviewId(null);
      })
      .catch((error) => console.error("Could not remove photo.", error));
  };

  const preview = attachments.find((item) => item.id === previewId) ?? null;

  return (
    <section className="screenStack">
      <div className="notesCard">
        <p className="sectionLabel">Session notes</p>
        <h2>{session.title}</h2>
        <textarea
          className="notesArea"
          value={body}
          placeholder="Jot down takeaways, questions, and follow-ups…"
          onChange={(event) => setBody(event.target.value)}
          onBlur={saveBody}
        />
        {savedTick ? (
          <span className="notesSaved">
            <Check size={14} /> Saved
          </span>
        ) : null}

        <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPickFile} />
        <button className="attachButton" onClick={() => fileInput.current?.click()}>
          <ImagePlus size={16} /> Attach photo
        </button>

        {attachments.length ? (
          <div className="attachGrid">
            {attachments.map((item) => (
              <button
                className="attachThumb"
                key={item.id}
                onClick={() => setPreviewId(item.id)}
                aria-label={`Preview ${item.label}`}
              >
                {urls[item.id] ? (
                  <img
                    src={urls[item.id]}
                    alt={item.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span className={`photoMock ${item.kind}`} />
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="attachEmpty">No photos attached yet.</p>
        )}
      </div>

      {preview ? (
        <div className="photoModal" role="dialog" aria-modal="true" onClick={() => setPreviewId(null)}>
          <div className="photoModalCard" onClick={(event) => event.stopPropagation()}>
            <div className="photoModalHead">
              <strong>{preview.label}</strong>
              <button className="photoModalClose" onClick={() => setPreviewId(null)} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>
            {urls[preview.id] ? (
              <img
                src={urls[preview.id]}
                alt={preview.label}
                style={{ width: "100%", maxHeight: 360, objectFit: "contain", borderRadius: 12, background: "#0b1020" }}
              />
            ) : (
              <div className={`photoMock large ${preview.kind}`}>
                <span />
              </div>
            )}
            <button className="photoModalRemove" onClick={() => removePhoto(preview.id)}>
              <Trash2 size={15} /> Remove photo
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RatingScreen({ session }: { session: Session }) {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const criteria = ratingCriteria;

  useEffect(() => {
    let cancelled = false;
    getRating(session.id)
      .then((rating) => {
        if (cancelled) return;
        const initial: Record<number, number> = {};
        criteria.forEach((criterion) => {
          initial[criterion.id] = rating.scores[String(criterion.id)] ?? 4;
        });
        setScores(initial);
        setFeedback(rating.feedback);
        setSubmitted(rating.submitted);
      })
      .catch((error) => console.error("Could not load rating.", error));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const submit = () => {
    putRating(session.id, feedback, scores)
      .then(() => setSubmitted(true))
      .catch((error) => console.error("Could not submit rating.", error));
  };

  return (
    <section className="screenStack">
      <div className="ratingIntro">
        <Star size={20} />
        <div>
          <h2>Rate this session</h2>
          <p>{session.title}</p>
        </div>
      </div>
      <div className="criteriaList">
        {criteria.map((criterion) => (
          <div className="criterion" key={criterion.id}>
            <div>
              <strong>{criterion.name}</strong>
              <span>{scores[criterion.id] ?? 4} / 5</span>
            </div>
            <input
              aria-label={`${criterion.name} rating`}
              type="range"
              min="1"
              max="5"
              value={scores[criterion.id] ?? 4}
              onChange={(event) =>
                setScores((current) => ({ ...current, [criterion.id]: Number(event.target.value) }))
              }
            />
          </div>
        ))}
      </div>
      <textarea
        className="feedbackBox"
        value={feedback}
        placeholder="Share what worked and what could be better…"
        onChange={(event) => setFeedback(event.target.value)}
      />
      <button className="submitButton" onClick={submit}>
        {submitted ? "Update feedback" : "Submit feedback"}
      </button>
    </section>
  );
}

function BottomNav({
  activeTab,
  onSelect,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "agenda" as const, label: "Agenda", icon: CalendarDays },
    { id: "schedule" as const, label: "Schedule", icon: CalendarCheck },
    { id: "map" as const, label: "Map", icon: Map },
  ];

  return (
    <nav className="bottomNav" aria-label="Primary navigation">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} className={activeTab === id ? "active" : ""} onClick={() => onSelect(id)}>
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [activeDay, setActiveDay] = useState<number>(1);
  const [manualDaySelection, setManualDaySelection] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agendaLocationFilter, setAgendaLocationFilter] = useState<string[]>([]);
  const [stack, setStack] = useState<Overlay[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = window.setInterval(tick, wallClockTickMs);
    return () => window.clearInterval(interval);
  }, []);

  // Reference look-ups live in module-level holders; reassign them and then
  // re-render via state so every screen re-reads the API-backed data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadState("loading");
        setLoadError(null);
        const [days, sess, profiles, notifs, spots, criteria] = await Promise.all([
          fetchDays(),
          fetchSessions(),
          fetchSpeakerProfiles(),
          fetchNotifications(),
          fetchMapSpots(),
          fetchRatingCriteria(),
        ]);
        if (cancelled) return;
        conferenceDays = days;
        speakerProfiles = profiles;
        notifications = notifs;
        mapSpots = spots;
        ratingCriteria = criteria;
        setManualDaySelection(false);
        setActiveDay(getDefaultActiveDay(days, new Date()));
        setSessions(sess);
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Could not load conference data from the API.", error);
        setLoadError(error instanceof Error ? error.message : "The app could not reach the conference API.");
        setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (manualDaySelection || loadState !== "ready" || !conferenceDays.length) return;
    setActiveDay(getDefaultActiveDay(conferenceDays, now));
  }, [loadState, manualDaySelection, now]);

  const clockedSessions = useMemo(() => syncSessionsToClock(sessions, now), [sessions, now]);

  const overlay = stack.length ? stack[stack.length - 1] : null;
  const overlaySessionId = overlay && "id" in overlay ? overlay.id : null;
  const overlaySession = useMemo(
    () => clockedSessions.find((session) => session.id === overlaySessionId) ?? null,
    [overlaySessionId, clockedSessions],
  );
  const agendaLocations = useMemo(() => deriveLocations(clockedSessions), [clockedSessions]);
  const appContent =
    loadState === "ready" ? (
      overlay ? (
        <>
          {overlay.kind === "session" && overlaySession && (
            <SessionDetail
              session={overlaySession}
              onNotes={() => pushOverlay({ kind: "notes", id: overlaySession.id })}
              onRating={() => pushOverlay({ kind: "rating", id: overlaySession.id })}
              onToggleSave={() => toggleSave(overlaySession.id)}
              onOpenSpeaker={(name) => pushOverlay({ kind: "speaker", name })}
            />
          )}
          {overlay.kind === "notes" && overlaySession && <NotesScreen session={overlaySession} />}
          {overlay.kind === "rating" && overlaySession && <RatingScreen session={overlaySession} />}
          {overlay.kind === "speaker" && <SpeakerScreen name={overlay.name} sessions={clockedSessions} />}
        </>
      ) : (
        <>
          {activeTab === "home" && <HomeScreen sessions={clockedSessions} onOpenSession={openSession} />}
          {activeTab === "agenda" && (
            <AgendaScreen
              sessions={clockedSessions}
              activeDay={activeDay}
              locations={agendaLocations}
              selectedLocations={agendaLocationFilter}
              onSelectDay={selectConferenceDay}
              onOpenSession={openSession}
              onToggleSave={toggleSave}
              onToggleLocation={toggleAgendaLocation}
              onClearLocations={clearAgendaLocations}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleScreen
              sessions={clockedSessions}
              activeDay={activeDay}
              now={now}
              onSelectDay={selectConferenceDay}
              onOpenSession={openSession}
            />
          )}
          {activeTab === "map" && <VenueMapScreen />}
        </>
      )
    ) : (
      <ConferenceLoadState state={loadState} error={loadError} />
    );

  function pushOverlay(next: Overlay) {
    setStack((current) => [...current, next]);
  }

  function goBack() {
    setStack((current) => current.slice(0, -1));
  }

  function selectTab(tab: Tab) {
    setStack([]);
    setActiveTab(tab);
  }

  function selectConferenceDay(day: number) {
    setManualDaySelection(true);
    setActiveDay(day);
  }

  function openSession(id: string) {
    const target = clockedSessions.find((session) => session.id === id);
    if (!isDrillableSession(target)) return;
    pushOverlay({ kind: "session", id });
  }

  function toggleAgendaLocation(location: string) {
    setAgendaLocationFilter((current) =>
      current.includes(location)
        ? current.filter((candidate) => candidate !== location)
        : [...current, location],
    );
  }

  function clearAgendaLocations() {
    setAgendaLocationFilter([]);
  }

  function toggleSave(id: string) {
    const current = sessions.find((session) => session.id === id);
    const previous = current?.saved ?? false;
    const nextSaved = !previous;
    // Optimistic update, then persist; roll back if the request fails.
    setSessions((list) => list.map((session) => (session.id === id ? { ...session, saved: nextSaved } : session)));
    apiSetSaved(id, nextSaved).catch((error) => {
      console.error("Could not update saved state.", error);
      setSessions((list) => list.map((session) => (session.id === id ? { ...session, saved: previous } : session)));
    });
  }

  return (
    <main className="prototypeShell">
      <div className="ambientCode codeOne">class JPrimeCompanion &#123;</div>
      <div className="ambientCode codeTwo">sync.notes().rate().save()</div>
      <div className="phoneFrame">
        <AppHeader
          activeTab={activeTab}
          overlay={overlay}
          session={overlaySession}
          onBack={goBack}
        />
        <div className="appBody">
          {appContent}
        </div>
        <BottomNav activeTab={activeTab} onSelect={selectTab} />
      </div>
      <aside className="desktopCompanion" aria-label="Prototype highlights">
        <span className="sectionLabel">Conference companion</span>
        <h2>Plan JPrime in your pocket</h2>
        <p>Keep the whole conference day organized from the palm of your hand. Browse the live agenda, save sessions, find rooms, capture notes, attach photos, and rate talks from one attendee-first mobile view.</p>
        <div className="desktopFeatureList">
          <span>
            <CalendarDays size={16} /> Live agenda and personal schedule
          </span>
          <span>
            <Map size={16} /> Venue map, booths, and room context
          </span>
          <span>
            <PenLine size={16} /> Notes, photo attachments, and ratings
          </span>
        </div>
      </aside>
    </main>
  );
}
