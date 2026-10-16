-- Cashly · 0005 · Historial de conversaciones del asistente
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0004).

create table public.assistant_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
             references auth.users(id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)            -- permite la FK compuesta de los mensajes
);

create table public.assistant_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id         uuid not null default auth.uid()
                  references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) between 1 and 20000),
  created_at      timestamptz not null default now(),
  -- El mensaje debe pertenecer a una conversación del mismo usuario.
  foreign key (conversation_id, user_id)
    references public.assistant_conversations (id, user_id)
    on delete cascade
);

create index assistant_conversations_user_idx
  on public.assistant_conversations (user_id, updated_at desc);
create index assistant_messages_conversation_idx
  on public.assistant_messages (conversation_id, created_at);

-- La conversación sube en la lista cuando recibe un mensaje nuevo.
create function public.touch_conversation() returns trigger
language plpgsql set search_path = '' as $$
begin
  update public.assistant_conversations
     set updated_at = now()
   where id = new.conversation_id and user_id = new.user_id;
  return new;
end $$;

create trigger assistant_messages_touch
after insert on public.assistant_messages
for each row execute function public.touch_conversation();

-- ============ RLS ============
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages      enable row level security;

revoke all on public.assistant_conversations, public.assistant_messages from anon;
grant select, insert, update, delete on public.assistant_conversations to authenticated;
grant select, insert, delete          on public.assistant_messages      to authenticated;

create policy "assistant_conversations_own" on public.assistant_conversations
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "assistant_messages_own" on public.assistant_messages
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
