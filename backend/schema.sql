-- =====================================================================
-- JUVENTUDE TECH — SCHEMA DO BANCO (Supabase / PostgreSQL)
-- =====================================================================
-- Este arquivo NÃO veio no projeto original — foi reconstruído a partir
-- dos campos que backend/index.js efetivamente usa. Rode este script
-- uma vez no SQL Editor do seu projeto Supabase (Project → SQL Editor →
-- New query → cole tudo → Run) ANTES de subir o backend.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- TABELA: alunos
-- =====================================================================
create table if not exists public.alunos (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null unique,
  nome                 text,
  data_nascimento      date,
  formacao             text check (formacao in ('fullstack', 'ia-gen', 'mkt-dig')),
  avatar               text,
  justificou_ausencia  boolean default false,
  se_ausenta_sempre    boolean default false,
  saldo_abonos         integer default 0,
  created_at           timestamptz default now()
);

create index if not exists idx_alunos_formacao on public.alunos (formacao);

-- =====================================================================
-- TABELA: presencas
-- =====================================================================
create table if not exists public.presencas (
  id              uuid primary key default gen_random_uuid(),
  aluno_email     text not null references public.alunos (email) on delete cascade,
  data            date not null,
  check_in        timestamp,
  check_out       timestamp,
  feedback_nota   integer check (feedback_nota between 1 and 5),
  feedback_texto  text,
  -- um único registro de presença por aluno por dia
  unique (aluno_email, data)
);

create index if not exists idx_presencas_aluno_email on public.presencas (aluno_email);
create index if not exists idx_presencas_data on public.presencas (data);

-- =====================================================================
-- TABELA: justificativas_logs
-- =====================================================================
create table if not exists public.justificativas_logs (
  id                uuid primary key default gen_random_uuid(),
  aluno_email       text not null references public.alunos (email) on delete cascade,
  tipo_recorrencia  text,
  created_at        timestamptz default now()
);

create index if not exists idx_justificativas_aluno_email on public.justificativas_logs (aluno_email);

-- =====================================================================
-- SEGURANÇA: habilita Row Level Security em todas as tabelas.
-- O backend usa a service_role key (que sempre ignora RLS), então a
-- aplicação continua funcionando normalmente. O que isso impede é que
-- alguém com a chave "anon" (pública) consiga ler/editar os dados dos
-- alunos diretamente pela API do Supabase, contornando o backend.
-- Nenhuma policy é criada de propósito — ou seja, com RLS ativo e sem
-- policies, o acesso via chave anônima fica totalmente bloqueado.
-- =====================================================================
alter table public.alunos enable row level security;
alter table public.presencas enable row level security;
alter table public.justificativas_logs enable row level security;
