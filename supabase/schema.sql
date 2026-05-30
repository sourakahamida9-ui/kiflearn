-- =====================================================================
--  KifLearn — Schéma Supabase complet
--  À coller dans : Supabase Dashboard > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  creator_id  uuid not null references public.profiles(id) on delete cascade,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references public.quizzes(id) on delete cascade,
  position       int  not null default 0,
  question       text not null,
  option_a       text not null,
  option_b       text not null,
  option_c       text,
  option_d       text,
  correct_answer text not null check (correct_answer in ('a','b','c','d')),
  time_limit     int  not null default 20,
  created_at     timestamptz not null default now()
);
create index if not exists questions_quiz_idx on public.questions(quiz_id, position);

create table if not exists public.sessions (
  id                     uuid primary key default gen_random_uuid(),
  quiz_id                uuid not null references public.quizzes(id) on delete cascade,
  host_id                uuid not null references public.profiles(id) on delete cascade,
  join_code              text not null,
  status                 text not null default 'lobby'
                           check (status in ('lobby','active','question_closed','finished')),
  current_question_index int  not null default -1,
  question_started_at    timestamptz,
  is_persistent          boolean not null default false,
  salon_label            text,
  created_at             timestamptz not null default now()
);
-- Un code reste unique tant que la session n'est pas terminée
create unique index if not exists sessions_active_code_idx
  on public.sessions(join_code) where status <> 'finished';

create table if not exists public.participants (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_name  text not null,
  score      int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists participants_session_idx on public.participants(session_id);

create table if not exists public.answers (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  question_id    uuid not null references public.questions(id) on delete cascade,
  answer         text check (answer in ('a','b','c','d')),
  is_correct     boolean not null default false,
  response_time  int,           -- millisecondes
  points         int  not null default 0,
  created_at     timestamptz not null default now(),
  unique (participant_id, question_id)
);
create index if not exists answers_session_q_idx on public.answers(session_id, question_id);

-- Vue publique des questions : SANS la bonne réponse (anti-triche)
create or replace view public.questions_public as
  select id, quiz_id, position, question, option_a, option_b, option_c, option_d, time_limit
  from public.questions;

-- ----------------------------------------------------------------------
-- CRÉATION AUTOMATIQUE DU PROFIL À L'INSCRIPTION
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------
-- FONCTIONS RPC (SECURITY DEFINER)
-- ----------------------------------------------------------------------

-- Crée une session (option salon persistant)
create or replace function public.create_session(
  p_quiz_id uuid,
  p_persistent boolean default false
)
returns public.sessions
language plpgsql security definer set search_path = public as $$
declare
  v_host    uuid := auth.uid();
  v_code    text;
  v_session public.sessions;
begin
  if v_host is null then raise exception 'Non authentifié'; end if;
  if not exists (select 1 from public.quizzes where id = p_quiz_id and creator_id = v_host) then
    raise exception 'Quiz introuvable ou non autorisé';
  end if;

  if p_persistent then
    select * into v_session from public.sessions
     where quiz_id = p_quiz_id and host_id = v_host and is_persistent = true
       and status <> 'finished'
     order by created_at desc limit 1;
    if v_session.id is not null then
      return v_session;
    end if;
  end if;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from public.sessions where join_code = v_code and status <> 'finished'
    );
  end loop;

  insert into public.sessions (quiz_id, host_id, join_code, is_persistent, salon_label)
  values (
    p_quiz_id, v_host, v_code,
    coalesce(p_persistent, false),
    case when p_persistent then 'Salon persistant' else null end
  )
  returning * into v_session;
  return v_session;
end; $$;

-- Rejoindre ou reconnecter une session
create or replace function public.join_session(
  p_code text,
  p_name text,
  p_participant_id uuid default null
)
returns public.participants
language plpgsql security definer set search_path = public as $$
declare
  v_session public.sessions;
  v_part    public.participants;
begin
  select * into v_session from public.sessions
   where join_code = p_code and status <> 'finished'
   order by created_at desc limit 1;
  if v_session.id is null then
    raise exception 'Code invalide ou session terminée';
  end if;

  if p_participant_id is not null then
    select * into v_part from public.participants
     where id = p_participant_id and session_id = v_session.id;
    if v_part.id is not null then
      return v_part;
    end if;
  end if;

  insert into public.participants (session_id, user_name)
  values (v_session.id, nullif(left(trim(p_name), 40), ''))
  returning * into v_part;
  return v_part;
end; $$;

-- Reconnexion par ID participant
create or replace function public.rejoin_participant(p_participant_id uuid)
returns public.participants
language plpgsql security definer set search_path = public as $$
declare
  v_part    public.participants;
  v_session public.sessions;
begin
  select * into v_part from public.participants where id = p_participant_id;
  if v_part.id is null then raise exception 'Participant introuvable'; end if;
  select * into v_session from public.sessions
   where id = v_part.session_id and status <> 'finished';
  if v_session.id is null then raise exception 'Session terminée ou introuvable'; end if;
  return v_part;
end; $$;

-- Soumettre une réponse : la correction se fait côté serveur (anti-triche)
create or replace function public.submit_answer(
  p_participant_id uuid,
  p_question_id    uuid,
  p_answer         text,
  p_response_time  int
)
returns table(is_correct boolean, points int)
language plpgsql security definer set search_path = public as $$
declare
  v_session    uuid;
  v_correct    text;
  v_limit      int;
  v_is_correct boolean;
  v_points     int := 0;
begin
  select session_id into v_session from public.participants where id = p_participant_id;
  if v_session is null then raise exception 'Participant introuvable'; end if;

  select correct_answer, time_limit into v_correct, v_limit
    from public.questions where id = p_question_id;
  if v_correct is null then raise exception 'Question introuvable'; end if;

  v_is_correct := (p_answer = v_correct);
  if v_is_correct then
    v_points := 500 + greatest(
      0,
      floor(500 * (v_limit * 1000 - least(coalesce(p_response_time, v_limit*1000), v_limit*1000))::numeric
            / (v_limit * 1000))
    )::int;
  end if;

  insert into public.answers
    (session_id, participant_id, question_id, answer, is_correct, response_time, points)
  values
    (v_session, p_participant_id, p_question_id, p_answer, v_is_correct, p_response_time, v_points)
  on conflict (participant_id, question_id) do nothing;

  if found then
    update public.participants set score = score + v_points where id = p_participant_id;
  end if;

  return query select v_is_correct, v_points;
end; $$;

-- ----------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.quizzes      enable row level security;
alter table public.questions    enable row level security;
alter table public.sessions     enable row level security;
alter table public.participants enable row level security;
alter table public.answers      enable row level security;

-- profiles
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- quizzes (créateur + lecture publique marketplace)
drop policy if exists "quizzes owner all" on public.quizzes;
drop policy if exists "quizzes public read" on public.quizzes;
create policy "quizzes owner all" on public.quizzes for all
  using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "quizzes public read" on public.quizzes for select
  using (is_public = true or auth.uid() = creator_id);

-- questions (créateur + quiz publics)
drop policy if exists "questions owner all" on public.questions;
drop policy if exists "questions public read" on public.questions;
create policy "questions owner all" on public.questions for all
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.creator_id = auth.uid()))
  with check (exists (select 1 from public.quizzes q where q.id = quiz_id and q.creator_id = auth.uid()));
create policy "questions public read" on public.questions for select
  using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.is_public = true)
    or exists (select 1 from public.quizzes q where q.id = quiz_id and q.creator_id = auth.uid())
  );

-- sessions : lecture publique (réalisée par les étudiants en temps réel), gestion par l'hôte
drop policy if exists "sessions read all"    on public.sessions;
drop policy if exists "sessions host insert" on public.sessions;
drop policy if exists "sessions host update" on public.sessions;
drop policy if exists "sessions host delete" on public.sessions;
create policy "sessions read all"    on public.sessions for select using (true);
create policy "sessions host insert" on public.sessions for insert with check (auth.uid() = host_id);
create policy "sessions host update" on public.sessions for update using (auth.uid() = host_id);
create policy "sessions host delete" on public.sessions for delete using (auth.uid() = host_id);

-- participants : lecture publique (classement), insertion via RPC
drop policy if exists "participants read all" on public.participants;
create policy "participants read all" on public.participants for select using (true);

-- answers : seul l'hôte de la session peut lire ; insertion via RPC
drop policy if exists "answers host read" on public.answers;
create policy "answers host read" on public.answers for select
  using (exists (select 1 from public.sessions s where s.id = session_id and s.host_id = auth.uid()));

-- ----------------------------------------------------------------------
-- GRANTS
-- ----------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.questions_public to anon, authenticated;
grant select on public.sessions          to anon, authenticated;
grant select on public.participants      to anon, authenticated;
grant execute on function public.join_session(text, text, uuid)          to anon, authenticated;
grant execute on function public.rejoin_participant(uuid)              to anon, authenticated;
grant execute on function public.submit_answer(uuid, uuid, text, int)  to anon, authenticated;
grant execute on function public.create_session(uuid, boolean)         to authenticated;

-- ----------------------------------------------------------------------
-- REALTIME (diffusion des changements aux clients)
-- ----------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.sessions;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.participants; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.answers;      exception when duplicate_object then null; end;
end $$;

-- =====================================================================
--  Fin du schéma KifLearn
-- =====================================================================
