-- Ejecutá esto en Supabase → SQL Editor → Run

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_date date not null,
  client_name text not null,
  client_phone text not null,
  event_type text not null default 'Otro',
  guests integer,
  notes text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmada', 'cancelada'))
);

create index if not exists reservations_event_date_idx on reservations (event_date);

alter table reservations enable row level security;

create policy "Anyone can create reservations"
  on reservations for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read reservations"
  on reservations for select
  to anon, authenticated
  using (true);

create policy "Anyone can update reservation status"
  on reservations for update
  to anon, authenticated
  using (true)
  with check (true);
