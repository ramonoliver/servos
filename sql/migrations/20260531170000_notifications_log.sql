-- ============================================================
-- notifications_log
-- Audit log for every notification dispatched by the system.
-- ============================================================

begin;

create table if not exists public.notifications_log (
  id             uuid          primary key default gen_random_uuid(),
  user_id        text          not null,
  type           text          not null,
  channels       text[]        not null default '{}',

  -- Per-channel status
  sms_status     text          check (sms_status   in ('sent','failed','skipped','pending')),
  email_status   text          check (email_status in ('sent','failed','skipped','pending')),

  -- Per-channel errors (null = no error)
  sms_error      text,
  email_error    text,

  -- Sanitized copy of the payload (no secrets)
  payload        jsonb         not null default '{}',

  created_at     timestamptz   not null default now(),
  sent_at        timestamptz
);

-- Index for per-user notification history queries
create index if not exists notifications_log_user_id_idx
  on public.notifications_log (user_id, created_at desc);

-- Index for type-based analytics
create index if not exists notifications_log_type_idx
  on public.notifications_log (type, created_at desc);

-- RLS: users can read their own logs; system writes via service role
alter table public.notifications_log enable row level security;

create policy "Users can read own notification logs"
  on public.notifications_log
  for select
  using (user_id = auth.uid()::text);

-- Service role bypasses RLS for inserts (used by server-side sendNotification)
-- No explicit insert policy needed when using the service role key.

-- ── notification_preferences column on users ─────────────────────────────────
-- Stores per-user opt-in/out as JSONB. Defaults to null → system uses defaults.
alter table public.users
  add column if not exists notification_preferences jsonb;

comment on column public.users.notification_preferences is
  'User notification opt-in preferences. Null = use system defaults. See NotificationPreferences type.';

commit;
