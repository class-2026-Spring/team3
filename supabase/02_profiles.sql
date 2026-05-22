create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "본인 프로필만 접근" on profiles
  for all using (auth.uid() = id);

-- 회원가입 시 자동으로 프로필 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
