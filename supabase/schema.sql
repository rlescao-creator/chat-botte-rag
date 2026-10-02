-- Schema for the "Insiders Dossier RAG" n8n workflow.
-- Run once in the Supabase SQL editor.

create extension if not exists vector with schema extensions;

-- 1. Chunks and their vectors -------------------------------------------------
-- Embeddings come from Gemini (gemini-embedding-001, 3072 dimensions).
-- The column has no fixed dimension, so there is no vector index: fine for small corpora.

create table if not exists public.documents_gemini (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding extensions.vector
);

create index if not exists documents_gemini_source_idx
  on public.documents_gemini ((metadata->>'source'));

-- Similarity search called by the Supabase Vector Store node.
create or replace function public.match_documents_gemini (
  query_embedding extensions.vector,
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
set search_path = public, extensions
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents_gemini d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- 2. Ingestion log --------------------------------------------------------------

create table if not exists public.rag_sources (
  id bigserial primary key,
  file_name text not null,
  chunk_count int,
  created_at timestamptz not null default now()
);

-- 3. Conversation history -------------------------------------------------------

create table if not exists public.chat_messages (
  id bigserial primary key,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at desc, id desc);

-- Only the service role (used by n8n) reads and writes these tables.
alter table public.documents_gemini enable row level security;
alter table public.rag_sources enable row level security;
alter table public.chat_messages enable row level security;
