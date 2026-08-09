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
