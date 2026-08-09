-- Newsletter schema. Applied by `npm run newsletter:migrate`, which is
-- idempotent and safe to re-run.

create table if not exists subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,             -- stored lowercased/trimmed
  blog            boolean not null default false,
  poetry          boolean not null default false,
  status          text not null default 'pending',  -- pending|confirmed|unsubscribed
  token           text not null unique,             -- confirm + manage + unsubscribe
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);

create index if not exists subscribers_status_idx on subscribers (status);

-- When the last confirmation mail went out. The signup form is public and
-- accepts any address, so without this a stranger can point unlimited mail at
-- somebody else's inbox from a verified sending domain.
alter table subscribers add column if not exists confirmation_sent_at timestamptz;

-- Topics an already-confirmed subscriber has *asked* for but not yet confirmed.
-- Adding a topic to a confirmed address has to cost a click, or the public form
-- becomes a way to sign other people up for mail they never agreed to.
-- Null on every row that isn't confirmed: those cannot receive anything until
-- they confirm anyway, so their columns widen in place.
alter table subscribers add column if not exists pending_blog boolean;
alter table subscribers add column if not exists pending_poetry boolean;

-- One row per post actually emailed. The unique constraint is the thing that
-- makes a double-click, a retry, or a second admin tab physically unable to
-- send the same post twice.
create table if not exists sends (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,      -- 'blog' | 'poetry'
  slug       text not null,
  subject    text not null,
  recipients integer not null default 0,
  sent_at    timestamptz not null default now(),
  unique (kind, slug)
);

-- Set only once every recipient has been delivered to. A row with a null
-- `completed_at` is a send that stopped partway — the provider's daily cap, a
-- function timeout — and is resumable rather than finished.
alter table sends add column if not exists completed_at timestamptz;

-- Who has already received which send. This is what makes a resumed send skip
-- the people it already reached: the (kind, slug) constraint prevents a second
-- blast, and this table prevents a resumed one from redelivering.
create table if not exists send_deliveries (
  send_id      uuid not null references sends (id) on delete cascade,
  email        text not null,
  delivered_at timestamptz not null default now(),
  primary key (send_id, email)
);

-- Sends that predate the delivery table have no per-recipient rows and are
-- finished by definition, so mark them complete rather than leaving them
-- looking resumable. Scoped to rows with no deliveries, so re-running this
-- migration cannot close a send that genuinely stopped partway.
update sends s
set completed_at = s.sent_at
where s.completed_at is null
  and not exists (select 1 from send_deliveries d where d.send_id = s.id);
