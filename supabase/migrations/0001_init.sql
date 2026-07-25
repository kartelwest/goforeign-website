-- ============================================================
-- GO FOREIGN — initial schema
-- Postgres 15+ / Supabase
-- ============================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- composite exclusion constraints
create extension if not exists "citext";     -- case-insensitive email columns

-- ---------- enums ----------
create type appointment_status as enum (
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
);

create type payment_status as enum (
  'unpaid', 'deposit_paid', 'paid', 'refunded', 'waived'
);

create type payment_method as enum (
  'zelle', 'cashapp', 'card', 'ach', 'cash', 'check', 'other'
);

create type block_source as enum ('manual', 'nunu_image', 'nunu_text', 'system');

-- ---------- shared trigger: updated_at ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- admin users (backoffice access allowlist)
-- ============================================================
create table admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  display_name  text,
  role          text not null default 'owner'
                  check (role in ('owner', 'assistant')),
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_admin_users_updated
  before update on admin_users
  for each row execute function set_updated_at();

-- ============================================================
-- services (what clients can book)
-- ============================================================
create table services (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  duration_minutes integer not null
                     check (duration_minutes in (20, 30, 60)),
  price_cents      integer check (price_cents >= 0),  -- null = "discussed later"
  currency         char(3) not null default 'USD',
  buffer_after_min integer not null default 10 check (buffer_after_min >= 0),
  is_active        boolean not null default true,
  is_public        boolean not null default true,     -- false = admin-only booking
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_services_updated
  before update on services
  for each row execute function set_updated_at();

create index idx_services_active on services (is_active, sort_order);

-- ============================================================
-- clients
-- ============================================================
create table clients (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         citext not null,
  phone         text,
  timezone      text not null default 'America/New_York',
  notes         text,                        -- private, admin-only
  tags          text[] not null default '{}',
  is_blocked    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (email)
);
create trigger trg_clients_updated
  before update on clients
  for each row execute function set_updated_at();

create index idx_clients_email on clients (email);
create index idx_clients_name  on clients using gin (to_tsvector('english', full_name));

-- ============================================================
-- availability rules (recurring weekly working hours)
-- ============================================================
create table availability_rules (
  id           uuid primary key default gen_random_uuid(),
  day_of_week  smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time   time not null,
  end_time     time not null,
  timezone     text not null default 'America/New_York',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_time > start_time)
);
create trigger trg_avail_rules_updated
  before update on availability_rules
  for each row execute function set_updated_at();

create index idx_avail_rules_dow on availability_rules (day_of_week, is_active);

-- ============================================================
-- availability blocks (time OFF: vacations, other job shifts, one-offs)
-- This is what Nu Nu writes to after approval.
-- ============================================================
create table availability_blocks (
  id           uuid primary key default gen_random_uuid(),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  all_day      boolean not null default false,
  label        text,                          -- "Work shift", "Vacation"
  source       block_source not null default 'manual',
  source_ref   uuid,                          -- -> nunu_uploads.id when applicable
  created_by   uuid references admin_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);
create trigger trg_avail_blocks_updated
  before update on availability_blocks
  for each row execute function set_updated_at();

create index idx_blocks_range on availability_blocks using gist (
  tstzrange(starts_at, ends_at)
);
create index idx_blocks_starts on availability_blocks (starts_at);

-- ============================================================
-- appointments
-- ============================================================
create table appointments (
  id                 uuid primary key default gen_random_uuid(),
  confirmation_code  text not null unique
                       default upper(substr(encode(gen_random_bytes(6),'hex'), 1, 8)),
  client_id          uuid not null references clients(id) on delete restrict,
  service_id         uuid not null references services(id) on delete restrict,

  starts_at          timestamptz not null,
  duration_minutes   integer not null check (duration_minutes in (20, 30, 60)),
  ends_at            timestamptz not null,          -- set by trigger below
  client_timezone    text not null default 'America/New_York',

  status             appointment_status not null default 'confirmed',
  intake_notes       text,                          -- what the client typed at booking
  source             text not null default 'web'
                       check (source in ('web', 'admin', 'nunu')),

  payment_status     payment_status not null default 'unpaid',
  quoted_price_cents integer check (quoted_price_cents >= 0),

  manage_token       text not null unique
                       default encode(gen_random_bytes(24), 'hex'),

  cancelled_at       timestamptz,
  cancellation_reason text,
  created_by         uuid references admin_users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- derive ends_at from starts_at + duration (generated columns can't do this
-- reliably with timestamptz, so use a trigger)
create or replace function set_appointment_end()
returns trigger language plpgsql as $$
begin
  new.ends_at := new.starts_at + make_interval(mins => new.duration_minutes);
  return new;
end;
$$;

create trigger trg_appt_end
  before insert or update of starts_at, duration_minutes on appointments
  for each row execute function set_appointment_end();

create trigger trg_appt_updated
  before update on appointments
  for each row execute function set_updated_at();

-- HARD double-booking prevention: no two live appointments may overlap.
alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed'));

create index idx_appt_starts   on appointments (starts_at);
create index idx_appt_status   on appointments (status, starts_at);
create index idx_appt_client   on appointments (client_id, starts_at desc);
create index idx_appt_payment  on appointments (payment_status)
  where payment_status <> 'paid';

-- ============================================================
-- appointment notes (append-only session log)
-- ============================================================
create table appointment_notes (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  body           text not null,
  note_type      text not null default 'session'
                   check (note_type in ('session','followup','internal','system')),
  is_pinned      boolean not null default false,
  author_id      uuid references admin_users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_notes_updated
  before update on appointment_notes
  for each row execute function set_updated_at();

create index idx_notes_appt on appointment_notes (appointment_id, created_at desc);
create index idx_notes_search on appointment_notes
  using gin (to_tsvector('english', body));

-- ============================================================
-- payments (manual now, processor-ready later)
-- ============================================================
create table payments (
  id                 uuid primary key default gen_random_uuid(),
  appointment_id     uuid references appointments(id) on delete set null,
  client_id          uuid references clients(id) on delete set null,
  amount_cents       integer not null check (amount_cents > 0),
  currency           char(3) not null default 'USD',
  method             payment_method not null,
  status             payment_status not null default 'paid',
  reference          text,          -- Zelle confirmation #, Stripe payment_intent, etc.
  received_at        timestamptz not null default now(),
  recorded_by        uuid references admin_users(id) on delete set null,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_payments_updated
  before update on payments
  for each row execute function set_updated_at();

create index idx_payments_appt on payments (appointment_id);
create index idx_payments_date on payments (received_at desc);

-- ============================================================
-- Nu Nu: uploaded schedule images
-- ============================================================
create table nunu_uploads (
  id             uuid primary key default gen_random_uuid(),
  storage_path   text not null,          -- private bucket path
  original_name  text,
  mime_type      text,
  byte_size      integer,
  parsed_json    jsonb,                  -- structured extraction result
  confidence     numeric(3,2) check (confidence between 0 and 1),
  status         text not null default 'pending'
                   check (status in ('pending','parsed','applied','rejected','failed')),
  error_message  text,
  applied_at     timestamptz,
  uploaded_by    uuid references admin_users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_nunu_uploads_updated
  before update on nunu_uploads
  for each row execute function set_updated_at();

create index idx_nunu_uploads_status on nunu_uploads (status, created_at desc);

-- ============================================================
-- Nu Nu: conversation history
-- ============================================================
create table nunu_messages (
  id              uuid primary key default gen_random_uuid(),
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  upload_id       uuid references nunu_uploads(id) on delete set null,
  proposed_action jsonb,          -- what Nu Nu wants to do
  action_status   text check (action_status in ('proposed','confirmed','rejected')),
  admin_id        uuid references admin_users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_nunu_msgs on nunu_messages (created_at desc);

-- ============================================================
-- settings (single-row key/value config)
-- ============================================================
create table settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
create trigger trg_settings_updated
  before update on settings
  for each row execute function set_updated_at();

-- ============================================================
-- audit log (every mutation, especially Nu Nu's)
-- ============================================================
create table audit_log (
  id          bigserial primary key,
  actor_type  text not null check (actor_type in ('admin','client','nunu','system')),
  actor_id    uuid,
  action      text not null,          -- 'appointment.created', 'block.applied'
  entity      text not null,
  entity_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);
create index idx_audit_entity  on audit_log (entity, entity_id, created_at desc);
create index idx_audit_created on audit_log (created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY — default deny on everything.
-- All access goes through server routes using the service_role key,
-- which bypasses RLS. The anon key can read nothing sensitive.
-- ============================================================
alter table admin_users         enable row level security;
alter table services            enable row level security;
alter table clients             enable row level security;
alter table availability_rules  enable row level security;
alter table availability_blocks enable row level security;
alter table appointments        enable row level security;
alter table appointment_notes   enable row level security;
alter table payments            enable row level security;
alter table nunu_uploads        enable row level security;
alter table nunu_messages       enable row level security;
alter table settings            enable row level security;
alter table audit_log           enable row level security;

-- The ONLY public read: active, public services (to render the booking menu).
create policy "public can read bookable services"
  on services for select
  to anon, authenticated
  using (is_active = true and is_public = true);

-- Everything else has no permissive policy = denied to anon/authenticated.
-- Availability and slot lookup must be served by a server route that returns
-- ONLY free/busy booleans — never appointment details, never client PII.

-- ============================================================
-- SEED DATA
-- ============================================================
insert into services (slug, name, description, duration_minutes, price_cents, sort_order)
values
  ('discovery-call', 'Discovery Call',
   'A brief introduction to see if Go Foreign is the right fit for your needs.',
   20, null, 1),
  ('focused-consult', 'Focused Consultation',
   'A single-topic working session or follow-up check-in.',
   30, null, 2),
  ('full-consultation', 'Full Consultation',
   'A comprehensive strategy session covering your full situation and next steps.',
   60, null, 3);

insert into settings (key, value) values
  ('booking',   '{"lead_time_hours":12,"booking_window_days":60,"slot_granularity_min":15,"max_per_day":6,"cancel_cutoff_hours":24}'),
  ('business',  '{"name":"Go Foreign","timezone":"America/New_York"}'),
  ('payments',  '{"public_message":"Payment methods and rates are confirmed directly with you after scheduling.","collect_at_booking":false}');

-- Default weekly hours: Mon-Fri 9am-6pm America/New_York (edit in the backoffice)
insert into availability_rules (day_of_week, start_time, end_time)
values (1,'09:00','18:00'), (2,'09:00','18:00'), (3,'09:00','18:00'),
       (4,'09:00','18:00'), (5,'09:00','18:00');
