create table favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  station_id text not null,
  station_name text not null,
  station_address text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, station_id)
);

alter table favorites enable row level security;

create policy "본인 즐겨찾기만 접근" on favorites
  for all using (auth.uid() = user_id);
