-- Conversation history for the answering chain of "Insiders Dossier RAG".

create table if not exists public.chat_messages (
  id bigserial primary key,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at desc, id desc);

alter table public.chat_messages enable row level security;
