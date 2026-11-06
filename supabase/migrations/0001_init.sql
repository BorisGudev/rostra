-- Rostra database. Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run),
-- or with `supabase db push` if you use the CLI. Safe to re-run: every statement is idempotent.
--
-- Who sees what (Row Level Security):
--   students   see and edit only their own rows;
--   teachers   also read the work of students in their own classes;
--   admins     (a school's Rostra contact) manage their school's teachers and classes;
--   the server (service role key, never in the browser) creates accounts and writes the usage log.

create extension if not exists pgcrypto;

-- ---------- schools, people, classes ----------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  display_name text not null default '',
  username text unique,
  school_id uuid references public.schools(id) on delete set null,
  lang text not null default 'en' check (lang in ('en', 'bg')),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  code text not null unique default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists classes_teacher on public.classes(teacher_id);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists class_members_student on public.class_members(student_id);

-- ---------- work ----------
-- The app stores each speech, draft, exam and the profile as one JSON document, exactly as it did in the browser.
create table if not exists public.docs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  id text not null,
  type text not null,
  body jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists docs_type on public.docs(user_id, type);

-- A task a teacher sets for a class: an oral exam setup or a speech brief.
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('viva', 'speech')),
  title text not null,
  config jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists assignments_class on public.assignments(class_id);

-- One row per finished piece of assigned work; the summary is what the teacher's table shows.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  doc_id text not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id, doc_id)
);

-- Every AI and transcription call, written by the server, so cost per student and per exam is measured.
create table if not exists public.usage (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  kind text not null,
  tier text,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  ms integer,
  doc_id text,
  step text,
  created_at timestamptz not null default now()
);
create index if not exists usage_user_day on public.usage(user_id, created_at);

-- ---------- helpers ----------
-- Every cross-table check used by a policy lives in one of these `security definer` functions. A policy that
-- queries another protected table directly would run that table's policies too, and two tables that check
-- each other recurse ("infinite recursion detected in policy"). The functions read as the table owner, so
-- they see every row and the policies stay one level deep.
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_school() returns uuid language sql stable security definer set search_path = public as
$$ select school_id from public.profiles where id = auth.uid() $$;

create or replace function public.my_username() returns text language sql stable security definer set search_path = public as
$$ select username from public.profiles where id = auth.uid() $$;

-- Is the signed-in user a teacher of this student (same class)?
create or replace function public.teaches(student uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.class_members cm join public.classes c on c.id = cm.class_id where cm.student_id = student and c.teacher_id = auth.uid()) $$;

-- Is the signed-in user a student in this class?
create or replace function public.is_member(cls uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.class_members where class_id = cls and student_id = auth.uid()) $$;

-- Does the signed-in user teach this class?
create or replace function public.owns_class(cls uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.classes where id = cls and teacher_id = auth.uid()) $$;

-- Was this assignment set for a class the signed-in user is in?
create or replace function public.assigned_to_me(assignment uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.assignments a join public.class_members m on m.class_id = a.class_id where a.id = assignment and m.student_id = auth.uid()) $$;

-- Did the signed-in user set this assignment?
create or replace function public.owns_assignment(assignment uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.assignments where id = assignment and teacher_id = auth.uid()) $$;

-- Which school does this user belong to? (for the admin's usage view)
create or replace function public.school_of(who uuid) returns uuid language sql stable security definer set search_path = public as
$$ select school_id from public.profiles where id = who $$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.docs enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.usage enable row level security;

drop policy if exists "schools: members read" on public.schools;
create policy "schools: members read" on public.schools for select to authenticated using (id = public.my_school());

drop policy if exists "profiles: own" on public.profiles;
create policy "profiles: own" on public.profiles for select to authenticated using (id = (select auth.uid()));
-- A user may change their display name and language. Role, school and username are set by the server only.
drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.my_role() and school_id is not distinct from public.my_school() and username is not distinct from public.my_username());
drop policy if exists "profiles: teachers read their students" on public.profiles;
create policy "profiles: teachers read their students" on public.profiles for select to authenticated using (public.teaches(id));
drop policy if exists "profiles: admins read their school" on public.profiles;
create policy "profiles: admins read their school" on public.profiles for select to authenticated using (public.my_role() = 'admin' and school_id = public.my_school());

drop policy if exists "classes: teacher" on public.classes;
create policy "classes: teacher" on public.classes for all to authenticated using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()) and school_id = public.my_school() and public.my_role() in ('teacher', 'admin'));
drop policy if exists "classes: members read" on public.classes;
create policy "classes: members read" on public.classes for select to authenticated using (public.is_member(id));
drop policy if exists "classes: admins read school" on public.classes;
create policy "classes: admins read school" on public.classes for select to authenticated using (public.my_role() = 'admin' and school_id = public.my_school());

-- Nobody inserts memberships directly: students join through join_class() with the class code.
drop policy if exists "members: own" on public.class_members;
create policy "members: own" on public.class_members for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "members: teacher" on public.class_members;
drop policy if exists "members: join by code" on public.class_members;
drop policy if exists "members: teacher reads" on public.class_members;
create policy "members: teacher reads" on public.class_members for select to authenticated using (public.owns_class(class_id));
drop policy if exists "members: teacher removes" on public.class_members;
create policy "members: teacher removes" on public.class_members for delete to authenticated using (public.owns_class(class_id));
drop policy if exists "members: student leaves" on public.class_members;
create policy "members: student leaves" on public.class_members for delete to authenticated using (student_id = (select auth.uid()));

drop policy if exists "docs: own" on public.docs;
create policy "docs: own" on public.docs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "docs: teacher reads students" on public.docs;
create policy "docs: teacher reads students" on public.docs for select to authenticated using (public.teaches(user_id));

drop policy if exists "assignments: teacher" on public.assignments;
create policy "assignments: teacher" on public.assignments for all to authenticated using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()) and public.owns_class(class_id));
drop policy if exists "assignments: class members read" on public.assignments;
create policy "assignments: class members read" on public.assignments for select to authenticated using (public.is_member(class_id));

-- A student writes a submission only for an assignment set to one of their classes, and only as themselves.
drop policy if exists "submissions: student" on public.submissions;
drop policy if exists "submissions: student reads" on public.submissions;
create policy "submissions: student reads" on public.submissions for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "submissions: student writes" on public.submissions;
create policy "submissions: student writes" on public.submissions for insert to authenticated with check (student_id = (select auth.uid()) and public.assigned_to_me(assignment_id));
drop policy if exists "submissions: student updates" on public.submissions;
create policy "submissions: student updates" on public.submissions for update to authenticated using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()) and public.assigned_to_me(assignment_id));
drop policy if exists "submissions: teacher reads" on public.submissions;
create policy "submissions: teacher reads" on public.submissions for select to authenticated using (public.owns_assignment(assignment_id));

drop policy if exists "usage: own" on public.usage;
create policy "usage: own" on public.usage for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "usage: teacher reads students" on public.usage;
create policy "usage: teacher reads students" on public.usage for select to authenticated using (public.teaches(user_id));
drop policy if exists "usage: admin reads school" on public.usage;
create policy "usage: admin reads school" on public.usage for select to authenticated using (public.my_role() = 'admin' and public.school_of(user_id) = public.my_school());

-- Joining a class with its code, without revealing the class list: returns the class id or null.
create or replace function public.join_class(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if public.my_role() <> 'student' then return null; end if; -- teachers and admins run classes, they do not sit in them
  select id into cid from public.classes where code = upper(trim(p_code)) and archived = false;
  if cid is null then return null; end if;
  insert into public.class_members (class_id, student_id) values (cid, auth.uid()) on conflict do nothing;
  return cid;
end $$;
revoke all on function public.join_class(text) from public;
grant execute on function public.join_class(text) to authenticated;

-- What a teacher sees: one row per student in one of their classes, with the latest exam and speech.
create or replace view public.teacher_students with (security_invoker = true) as
select c.id as class_id, c.name as class_name, p.id as student_id, p.display_name, p.username, m.joined_at,
  (select count(*) from public.docs d where d.user_id = p.id and d.type = 'viva' and d.body->>'status' = 'done') as exams_done,
  (select count(*) from public.docs d where d.user_id = p.id and d.type = 'speech') as speeches,
  (select max(d.updated_at) from public.docs d where d.user_id = p.id) as last_active
from public.classes c
join public.class_members m on m.class_id = c.id
join public.profiles p on p.id = m.student_id;
