-- migration: 20251016000000_create_core_learning_schema.sql
-- purpose: create core learning schema per db-plan (enums, tables, fks, indexes, views) with comprehensive rls policies for supabase roles.
-- affected:
--   types: content_usage_type, user_progress_status, message_sender
--   tables: profiles, sections, topics, topic_dependencies, learning_content,
--           diagnostic_tests, diagnostic_test_learning_content, diagnostic_test_attempts,
--           user_answers, sessions, session_messages, user_progress
--   views: vw_user_skill_map, vw_session_details
-- notes:
--   - rls is enabled on all tables (including reference/content tables) to comply with security best practices.
--   - reference/content tables expose read-only select for both anon and authenticated; data-modification is denied.
--   - user-owned tables restrict access to the owning user via auth.uid().
--   - uses gen_random_uuid() -> requires pgcrypto extension.
--   - destructive statements are not used in this migration.

-- enable required extension(s)
create extension if not exists pgcrypto with schema public;

-- ### 1. enum types ###
create type content_usage_type as enum ('explanation', 'exercise', 'diagnostic_question');
create type user_progress_status as enum ('not_started', 'in_progress', 'completed');
create type message_sender as enum ('user', 'ai');

-- ### 2. tables ###

-- stores public user data; private/auth data resides in auth.users
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    login text unique not null check (char_length(login) >= 3),
    email text unique not null,
    has_completed_tutorial boolean not null default false,
    created_at timestamptz not null default now()
);

-- knowledge graph: broader subject areas
create table public.sections (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    display_order int not null,
    created_at timestamptz not null default now()
);

-- knowledge graph: concepts within a section
create table public.topics (
    id uuid primary key default gen_random_uuid(),
    section_id uuid not null references public.sections(id) on delete cascade,
    title text not null,
    description text,
    display_order int not null,
    created_at timestamptz not null default now()
);

-- prerequisites between topics (self-join)
create table public.topic_dependencies (
    topic_id uuid not null references public.topics(id) on delete cascade,
    dependency_id uuid not null references public.topics(id) on delete cascade,
    primary key (topic_id, dependency_id)
);

-- central repository for educational materials
create table public.learning_content (
    id uuid primary key default gen_random_uuid(),
    topic_id uuid references public.topics(id) on delete cascade,
    usage_type content_usage_type not null,
    content jsonb not null,
    is_verified boolean not null default false,
    created_at timestamptz not null default now()
);

-- defines a diagnostic test for a specific section
create table public.diagnostic_tests (
    id uuid primary key default gen_random_uuid(),
    section_id uuid unique not null references public.sections(id) on delete cascade,
    title text not null,
    created_at timestamptz not null default now()
);

-- links diagnostic test with learning content items (questions)
create table public.diagnostic_test_learning_content (
    test_id uuid not null references public.diagnostic_tests(id) on delete cascade,
    content_id uuid not null references public.learning_content(id) on delete cascade,
    primary key (test_id, content_id)
);

-- records a user's diagnostic test attempt
create table public.diagnostic_test_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    diagnostic_test_id uuid not null references public.diagnostic_tests(id) on delete cascade,
    score float not null check (score >= 0 and score <= 1),
    completed_at timestamptz not null default now()
);

-- stores user's answers in a given attempt
create table public.user_answers (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid not null references public.diagnostic_test_attempts(id) on delete cascade,
    content_id uuid not null references public.learning_content(id) on delete cascade,
    answer_content jsonb not null,
    is_correct boolean not null
);

-- represents a single learning session
create table public.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    topic_id uuid references public.topics(id),
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    ai_summary text
);

-- transcript of a learning session
create table public.session_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    sender message_sender not null,
    content jsonb not null,
    created_at timestamptz not null default now()
);

-- tracks a user's mastery for a topic
create table public.user_progress (
    user_id uuid not null references public.profiles(id) on delete cascade,
    topic_id uuid not null references public.topics(id) on delete cascade,
    status user_progress_status not null default 'not_started',
    score float check (score >= 0 and score <= 1),
    updated_at timestamptz not null default now(),
    primary key (user_id, topic_id)
);

-- ### 3. functions & triggers ###

-- creates a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, login, email)
  values (new.id, new.raw_user_meta_data->>'login', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ### 4. views ###

-- simplified overview of user's skill map ordered by display_order
create or replace view public.vw_user_skill_map as
select
    p.id as user_id,
    s.id as section_id,
    s.title as section_title,
    t.id as topic_id,
    t.title as topic_title,
    coalesce(up.status, 'not_started') as status,
    up.score
from
    public.profiles p
cross join public.sections s
join public.topics t on s.id = t.section_id
left join public.user_progress up on p.id = up.user_id and t.id = up.topic_id
order by s.display_order, t.display_order;

-- session details with user and topic info
create or replace view public.vw_session_details as
select
    s.id as session_id,
    s.started_at,
    s.ended_at,
    s.ai_summary,
    p.id as user_id,
    p.login,
    t.id as topic_id,
    t.title as topic_title
from
    public.sessions s
join public.profiles p on s.user_id = p.id
left join public.topics t on s.topic_id = t.id;

-- ### 5. indexes ###

-- foreign key indexes
create index if not exists topics_section_id_idx on public.topics (section_id);
create index if not exists learning_content_topic_id_idx on public.learning_content (topic_id);
create index if not exists diagnostic_tests_section_id_idx on public.diagnostic_tests (section_id);
create index if not exists dtlc_test_id_idx on public.diagnostic_test_learning_content (test_id);
create index if not exists dtlc_content_id_idx on public.diagnostic_test_learning_content (content_id);
create index if not exists dta_user_id_idx on public.diagnostic_test_attempts (user_id);
create index if not exists dta_diagnostic_test_id_idx on public.diagnostic_test_attempts (diagnostic_test_id);
create index if not exists user_answers_attempt_id_idx on public.user_answers (attempt_id);
create index if not exists user_answers_content_id_idx on public.user_answers (content_id);
create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_topic_id_idx on public.sessions (topic_id);
create index if not exists session_messages_session_id_idx on public.session_messages (session_id);
create index if not exists user_progress_topic_id_idx on public.user_progress (topic_id);

-- composite indexes
create index if not exists user_progress_user_id_topic_id_idx on public.user_progress (user_id, topic_id);

-- other indexes
create index if not exists learning_content_content_gin_idx on public.learning_content using gin (content);

-- ### 6. row level security (rls) ###

-- enable rls on all tables, including reference/content tables
alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.topics enable row level security;
alter table public.topic_dependencies enable row level security;
alter table public.learning_content enable row level security;
alter table public.diagnostic_tests enable row level security;
alter table public.diagnostic_test_learning_content enable row level security;
alter table public.diagnostic_test_attempts enable row level security;
alter table public.user_answers enable row level security;
alter table public.sessions enable row level security;
alter table public.session_messages enable row level security;
alter table public.user_progress enable row level security;

-- policies below are granular: one per action and per role (anon/authenticated)
-- reference/content tables: readable by everyone (anon/authenticated), writes denied

-- sections
create policy sections_select_anon on public.sections for select to anon using (true);
create policy sections_select_authenticated on public.sections for select to authenticated using (true);
create policy sections_insert_anon_deny on public.sections for insert to anon with check (false);
create policy sections_insert_authenticated_deny on public.sections for insert to authenticated with check (false);
create policy sections_update_anon_deny on public.sections for update to anon using (false) with check (false);
create policy sections_update_authenticated_deny on public.sections for update to authenticated using (false) with check (false);
create policy sections_delete_anon_deny on public.sections for delete to anon using (false);
create policy sections_delete_authenticated_deny on public.sections for delete to authenticated using (false);

-- topics
create policy topics_select_anon on public.topics for select to anon using (true);
create policy topics_select_authenticated on public.topics for select to authenticated using (true);
create policy topics_insert_anon_deny on public.topics for insert to anon with check (false);
create policy topics_insert_authenticated_deny on public.topics for insert to authenticated with check (false);
create policy topics_update_anon_deny on public.topics for update to anon using (false) with check (false);
create policy topics_update_authenticated_deny on public.topics for update to authenticated using (false) with check (false);
create policy topics_delete_anon_deny on public.topics for delete to anon using (false);
create policy topics_delete_authenticated_deny on public.topics for delete to authenticated using (false);

-- topic_dependencies
create policy topic_dependencies_select_anon on public.topic_dependencies for select to anon using (true);
create policy topic_dependencies_select_authenticated on public.topic_dependencies for select to authenticated using (true);
create policy topic_dependencies_insert_anon_deny on public.topic_dependencies for insert to anon with check (false);
create policy topic_dependencies_insert_authenticated_deny on public.topic_dependencies for insert to authenticated with check (false);
create policy topic_dependencies_update_anon_deny on public.topic_dependencies for update to anon using (false) with check (false);
create policy topic_dependencies_update_authenticated_deny on public.topic_dependencies for update to authenticated using (false) with check (false);
create policy topic_dependencies_delete_anon_deny on public.topic_dependencies for delete to anon using (false);
create policy topic_dependencies_delete_authenticated_deny on public.topic_dependencies for delete to authenticated using (false);

-- learning_content
create policy learning_content_select_anon on public.learning_content for select to anon using (true);
create policy learning_content_select_authenticated on public.learning_content for select to authenticated using (true);
create policy learning_content_insert_anon_deny on public.learning_content for insert to anon with check (false);
create policy learning_content_insert_authenticated_deny on public.learning_content for insert to authenticated with check (false);
create policy learning_content_update_anon_deny on public.learning_content for update to anon using (false) with check (false);
create policy learning_content_update_authenticated_deny on public.learning_content for update to authenticated using (false) with check (false);
create policy learning_content_delete_anon_deny on public.learning_content for delete to anon using (false);
create policy learning_content_delete_authenticated_deny on public.learning_content for delete to authenticated using (false);

-- diagnostic_tests
create policy diagnostic_tests_select_anon on public.diagnostic_tests for select to anon using (true);
create policy diagnostic_tests_select_authenticated on public.diagnostic_tests for select to authenticated using (true);
create policy diagnostic_tests_insert_anon_deny on public.diagnostic_tests for insert to anon with check (false);
create policy diagnostic_tests_insert_authenticated_deny on public.diagnostic_tests for insert to authenticated with check (false);
create policy diagnostic_tests_update_anon_deny on public.diagnostic_tests for update to anon using (false) with check (false);
create policy diagnostic_tests_update_authenticated_deny on public.diagnostic_tests for update to authenticated using (false) with check (false);
create policy diagnostic_tests_delete_anon_deny on public.diagnostic_tests for delete to anon using (false);
create policy diagnostic_tests_delete_authenticated_deny on public.diagnostic_tests for delete to authenticated using (false);

-- diagnostic_test_learning_content (join table)
create policy dtlc_select_anon on public.diagnostic_test_learning_content for select to anon using (true);
create policy dtlc_select_authenticated on public.diagnostic_test_learning_content for select to authenticated using (true);
create policy dtlc_insert_anon_deny on public.diagnostic_test_learning_content for insert to anon with check (false);
create policy dtlc_insert_authenticated_deny on public.diagnostic_test_learning_content for insert to authenticated with check (false);
create policy dtlc_update_anon_deny on public.diagnostic_test_learning_content for update to anon using (false) with check (false);
create policy dtlc_update_authenticated_deny on public.diagnostic_test_learning_content for update to authenticated using (false) with check (false);
create policy dtlc_delete_anon_deny on public.diagnostic_test_learning_content for delete to anon using (false);
create policy dtlc_delete_authenticated_deny on public.diagnostic_test_learning_content for delete to authenticated using (false);

-- user-owned tables: authenticated users can manage their own rows; anon denied

-- profiles
create policy profiles_select_anon_deny on public.profiles for select to anon using (false);
create policy profiles_select_authenticated on public.profiles for select to authenticated using (auth.uid() = id);
create policy profiles_insert_anon_deny on public.profiles for insert to anon with check (false);
create policy profiles_insert_authenticated on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_anon_deny on public.profiles for update to anon using (false) with check (false);
create policy profiles_update_authenticated on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_anon_deny on public.profiles for delete to anon using (false);
create policy profiles_delete_authenticated on public.profiles for delete to authenticated using (auth.uid() = id);

-- diagnostic_test_attempts
create policy dta_select_anon_deny on public.diagnostic_test_attempts for select to anon using (false);
create policy dta_select_authenticated on public.diagnostic_test_attempts for select to authenticated using (auth.uid() = user_id);
create policy dta_insert_anon_deny on public.diagnostic_test_attempts for insert to anon with check (false);
create policy dta_insert_authenticated on public.diagnostic_test_attempts for insert to authenticated with check (auth.uid() = user_id);
create policy dta_update_anon_deny on public.diagnostic_test_attempts for update to anon using (false) with check (false);
create policy dta_update_authenticated on public.diagnostic_test_attempts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy dta_delete_anon_deny on public.diagnostic_test_attempts for delete to anon using (false);
create policy dta_delete_authenticated on public.diagnostic_test_attempts for delete to authenticated using (auth.uid() = user_id);

-- user_answers (ownership via attempt -> user)
create policy ua_select_anon_deny on public.user_answers for select to anon using (false);
create policy ua_select_authenticated on public.user_answers for select to authenticated using (
  exists (
    select 1 from public.diagnostic_test_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  )
);
create policy ua_insert_anon_deny on public.user_answers for insert to anon with check (false);
create policy ua_insert_authenticated on public.user_answers for insert to authenticated with check (
  exists (
    select 1 from public.diagnostic_test_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  )
);
create policy ua_update_anon_deny on public.user_answers for update to anon using (false) with check (false);
create policy ua_update_authenticated on public.user_answers for update to authenticated using (
  exists (
    select 1 from public.diagnostic_test_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.diagnostic_test_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  )
);
create policy ua_delete_anon_deny on public.user_answers for delete to anon using (false);
create policy ua_delete_authenticated on public.user_answers for delete to authenticated using (
  exists (
    select 1 from public.diagnostic_test_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  )
);

-- sessions
create policy sessions_select_anon_deny on public.sessions for select to anon using (false);
create policy sessions_select_authenticated on public.sessions for select to authenticated using (auth.uid() = user_id);
create policy sessions_insert_anon_deny on public.sessions for insert to anon with check (false);
create policy sessions_insert_authenticated on public.sessions for insert to authenticated with check (auth.uid() = user_id);
create policy sessions_update_anon_deny on public.sessions for update to anon using (false) with check (false);
create policy sessions_update_authenticated on public.sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sessions_delete_anon_deny on public.sessions for delete to anon using (false);
create policy sessions_delete_authenticated on public.sessions for delete to authenticated using (auth.uid() = user_id);

-- session_messages (ownership via session -> user)
create policy sm_select_anon_deny on public.session_messages for select to anon using (false);
create policy sm_select_authenticated on public.session_messages for select to authenticated using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);
create policy sm_insert_anon_deny on public.session_messages for insert to anon with check (false);
create policy sm_insert_authenticated on public.session_messages for insert to authenticated with check (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);
create policy sm_update_anon_deny on public.session_messages for update to anon using (false) with check (false);
create policy sm_update_authenticated on public.session_messages for update to authenticated using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);
create policy sm_delete_anon_deny on public.session_messages for delete to anon using (false);
create policy sm_delete_authenticated on public.session_messages for delete to authenticated using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and s.user_id = auth.uid()
  )
);

-- user_progress
create policy up_select_anon_deny on public.user_progress for select to anon using (false);
create policy up_select_authenticated on public.user_progress for select to authenticated using (auth.uid() = user_id);
create policy up_insert_anon_deny on public.user_progress for insert to anon with check (false);
create policy up_insert_authenticated on public.user_progress for insert to authenticated with check (auth.uid() = user_id);
create policy up_update_anon_deny on public.user_progress for update to anon using (false) with check (false);
create policy up_update_authenticated on public.user_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy up_delete_anon_deny on public.user_progress for delete to anon using (false);
create policy up_delete_authenticated on public.user_progress for delete to authenticated using (auth.uid() = user_id);

-- end of migration


