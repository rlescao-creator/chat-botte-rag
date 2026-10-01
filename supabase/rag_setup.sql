-- Schema for the "Insiders Dossier RAG" n8n workflow.
-- Embedding model: OpenAI text-embedding-3-small (1536 dimensions).

create extension if not exists vector with schema extensions;

create table if not exists public.documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding extensions.vector(1536)
);

create index if not exists documents_embedding_idx
  on public.documents using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists documents_metadata_source_idx
  on public.documents ((metadata->>'source'));

create or replace function public.match_documents (
  query_embedding extensions.vector(1536),
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
  from public.documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

create table if not exists public.rag_sources (
  id bigserial primary key,
  file_name text not null,
  chunk_count int,
  created_at timestamptz not null default now()
);

-- Only the service role (used by n8n) reads and writes these tables.
alter table public.documents enable row level security;
alter table public.rag_sources enable row level security;
