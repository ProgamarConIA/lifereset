-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles table
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  category text check (category in ('gym', 'study', 'work', 'personal')) default 'personal',
  completed boolean default false,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- habits table
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  color text default '#6366f1',
  icon text default '⭐',
  frequency text default 'daily',
  created_at timestamptz default now()
);

-- habit_logs table
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz default now(),
  unique(habit_id, completed_date)
);

-- events table
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table events enable row level security;
alter table notes enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- RLS Policies for tasks
create policy "Users can view own tasks"
  on tasks for select using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete using (auth.uid() = user_id);

-- RLS Policies for habits
create policy "Users can view own habits"
  on habits for select using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on habits for insert with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on habits for update using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on habits for delete using (auth.uid() = user_id);

-- RLS Policies for habit_logs
create policy "Users can view own habit_logs"
  on habit_logs for select using (auth.uid() = user_id);

create policy "Users can insert own habit_logs"
  on habit_logs for insert with check (auth.uid() = user_id);

create policy "Users can delete own habit_logs"
  on habit_logs for delete using (auth.uid() = user_id);

-- RLS Policies for events
create policy "Users can view own events"
  on events for select using (auth.uid() = user_id);

create policy "Users can insert own events"
  on events for insert with check (auth.uid() = user_id);

create policy "Users can update own events"
  on events for update using (auth.uid() = user_id);

create policy "Users can delete own events"
  on events for delete using (auth.uid() = user_id);

-- RLS Policies for notes
create policy "Users can view own notes"
  on notes for select using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on notes for insert with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on notes for update using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on notes for delete using (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to update updated_at on tasks
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tasks_updated_at
  before update on tasks
  for each row execute procedure update_updated_at_column();

create trigger update_notes_updated_at
  before update on notes
  for each row execute procedure update_updated_at_column();
