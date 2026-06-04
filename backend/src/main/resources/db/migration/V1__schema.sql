-- ── Reference / static conference data ──────────────────────────────

create table conference_day (
    id            smallint     primary key,
    weekday       varchar(16)  not null,
    wd_short      varchar(8)   not null,
    date_label    varchar(32)  not null,
    short_label   varchar(16)  not null,
    calendar_date date         not null
);

create table room (
    id   serial      primary key,
    name varchar(64) not null unique
);

create table map_spot (
    id         serial      primary key,
    name       varchar(64) not null,
    pos_x      varchar(8)  not null,
    pos_y      varchar(8)  not null,
    kind       varchar(16) not null,
    sort_order smallint    not null
);

create table speaker (
    id       serial       primary key,
    name     varchar(128) not null unique,
    role     varchar(128) not null,
    org      varchar(128) not null,
    location varchar(128) not null,
    pronoun  varchar(32)  not null,
    bio      text         not null,
    handle   varchar(64)  not null
);

create table speaker_tag (
    speaker_id integer     not null references speaker (id) on delete cascade,
    tag        varchar(64) not null,
    sort_order integer     not null,
    primary key (speaker_id, sort_order)
);

create table session (
    id          varchar(16)  primary key,
    day_id      smallint     not null references conference_day (id),
    start_time  time         not null,
    end_time    time         not null,
    title       varchar(256) not null,
    room_id     integer      not null references room (id),
    track       varchar(16)  not null,
    level       varchar(32)  not null default '',
    kind        varchar(16)  not null check (kind in ('keynote', 'lecture', 'workshop', 'break')),
    plenary     boolean      not null default false,
    description text         not null,
    status      varchar(16)  not null check (status in ('upcoming', 'live', 'done')),
    sort_order  integer      not null
);
create index idx_session_day on session (day_id);

create table session_speaker (
    session_id varchar(16) not null references session (id) on delete cascade,
    speaker_id integer     not null references speaker (id),
    sort_order integer     not null,
    primary key (session_id, sort_order)
);

create table session_material (
    session_id varchar(16) not null references session (id) on delete cascade,
    material   varchar(64) not null,
    sort_order integer     not null,
    primary key (session_id, sort_order)
);

create table notification (
    id         varchar(16)  primary key,
    kind       varchar(16)  not null check (kind in ('reminder', 'alert', 'info')),
    title      varchar(128) not null,
    body       text         not null,
    time_label varchar(32)  not null,
    unread     boolean      not null default true,
    sort_order smallint     not null
);

create table rating_criterion (
    id         serial      primary key,
    name       varchar(64) not null unique,
    sort_order smallint    not null
);

-- ── User-generated data (keyed by anonymous device id) ──────────────

create table saved_session (
    device_id  varchar(64) not null,
    session_id varchar(16) not null references session (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (device_id, session_id)
);
create index idx_saved_device on saved_session (device_id);

create table session_note (
    id         bigserial   primary key,
    device_id  varchar(64) not null,
    session_id varchar(16) not null references session (id) on delete cascade,
    body       text        not null default '',
    updated_at timestamptz not null default now(),
    unique (device_id, session_id)
);
create index idx_note_device on session_note (device_id);

create table note_attachment (
    id           bigserial   primary key,
    note_id      bigint      not null references session_note (id) on delete cascade,
    kind         varchar(16) not null check (kind in ('whiteboard', 'slide', 'badge')),
    label        varchar(128) not null,
    content_type varchar(64) not null,
    data         bytea       not null,
    created_at   timestamptz not null default now()
);
create index idx_attachment_note on note_attachment (note_id);

create table session_rating (
    id         bigserial   primary key,
    device_id  varchar(64) not null,
    session_id varchar(16) not null references session (id) on delete cascade,
    feedback   text        not null default '',
    updated_at timestamptz not null default now(),
    unique (device_id, session_id)
);
create index idx_rating_device on session_rating (device_id);

create table rating_score (
    rating_id    bigint   not null references session_rating (id) on delete cascade,
    criterion_id integer  not null references rating_criterion (id),
    score        smallint not null check (score between 1 and 5),
    primary key (rating_id, criterion_id)
);
