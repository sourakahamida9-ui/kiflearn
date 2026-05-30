-- =====================================================================
--  KifLearn V2 — À exécuter dans Supabase SQL Editor
--  (PWA, marketplace, salons persistants, reconnexion)
-- =====================================================================

-- Quiz publics (marketplace)
alter table public.quizzes
  add column if not exists is_public boolean not null default false;

-- Salons persistants
alter table public.sessions
  add column if not exists is_persistent boolean not null default false,
  add column if not exists salon_label text;

-- Lecture des quiz publics par tous
drop policy if exists "quizzes public read" on public.quizzes;
create policy "quizzes public read" on public.quizzes for select
  using (is_public = true or auth.uid() = creator_id);

-- Questions des quiz publics (copie marketplace)
drop policy if exists "questions public read" on public.questions;
create policy "questions public read" on public.questions for select
  using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.is_public = true)
    or exists (select 1 from public.quizzes q where q.id = quiz_id and q.creator_id = auth.uid())
  );

-- Création de session (option salon persistant)
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
    p_quiz_id,
    v_host,
    v_code,
    coalesce(p_persistent, false),
    case when p_persistent then 'Salon persistant' else null end
  )
  returning * into v_session;
  return v_session;
end; $$;

-- Rejoindre ou reconnecter un participant
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

-- Reconnexion directe par ID participant
create or replace function public.rejoin_participant(p_participant_id uuid)
returns public.participants
language plpgsql security definer set search_path = public as $$
declare
  v_part    public.participants;
  v_session public.sessions;
begin
  select * into v_part from public.participants where id = p_participant_id;
  if v_part.id is null then
    raise exception 'Participant introuvable';
  end if;
  select * into v_session from public.sessions
   where id = v_part.session_id and status <> 'finished';
  if v_session.id is null then
    raise exception 'Session terminée ou introuvable';
  end if;
  return v_part;
end; $$;

grant execute on function public.rejoin_participant(uuid) to anon, authenticated;
grant execute on function public.create_session(uuid, boolean) to authenticated;
