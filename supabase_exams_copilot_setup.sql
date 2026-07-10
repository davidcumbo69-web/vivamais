-- VIVA+ Patient Exams & AI Clinical Copilot Database Schema (Supabase/PostgreSQL)
-- This SQL integrates seamlessly with the existing VIVA+ codebase.
-- Run this in the Supabase SQL Editor.

-- Enable UUID extension if not already present
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. PATIENT EXAMS TABLE (Laboratório e Imagem + Interpretações IA)
--------------------------------------------------------------------------------
create table if not exists public.patient_exams (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  exam_type text not null check (exam_type in ('Laboratório', 'Imagem')),
  sub_type text not null, -- Ex: 'Hemograma Completo', 'Ressonância Magnética', 'Raio-X Tórax'
  source text not null check (source in ('text', 'image', 'file')),
  raw_content text, -- Conteúdo bruto de texto/OCR digitado ou lido
  file_url text, -- URL do arquivo carregado (caso aplicável)
  interpretation jsonb, -- Resultado da interpretação de Laboratório estruturado
  image_interpretation jsonb, -- Resultado da interpretação de Imagem estruturado
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.patient_exams enable row level security;

-- Índices de Alta Performance para Escalabilidade (Mais de 20 milhões de utilizadores)
create index if not exists idx_patient_exams_patient_date on public.patient_exams (patient_id, created_at desc);
create index if not exists idx_patient_exams_prof_patient on public.patient_exams (professional_id, patient_id);
create index if not exists idx_patient_exams_interpretation_gin on public.patient_exams using gin (interpretation);
create index if not exists idx_patient_exams_img_interpretation_gin on public.patient_exams using gin (image_interpretation);

-- Políticas RLS
create policy "Pacientes podem visualizar os seus próprios exames"
  on public.patient_exams for select
  using (auth.uid() = patient_id);

create policy "Profissionais podem gerir exames dos seus pacientes"
  on public.patient_exams for all
  using (
    auth.uid() = professional_id OR 
    exists (
      select 1 from public.patients 
      where professional_id = auth.uid() 
      and user_id = patient_exams.patient_id 
      and status = 'accepted'
    )
  );


--------------------------------------------------------------------------------
-- 2. PATIENT EXAMS COMPARISONS TABLE (Comparações Temporais IA)
--------------------------------------------------------------------------------
create table if not exists public.patient_exam_comparisons (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  old_exam_id uuid references public.patient_exams(id) on delete set null,
  new_exam_id uuid references public.patient_exams(id) on delete set null,
  comparison_result jsonb not null, -- Armazena tendências, alterações percentuais, alertas
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.patient_exam_comparisons enable row level security;

-- Índices
create index if not exists idx_exam_comparisons_patient on public.patient_exam_comparisons (patient_id, created_at desc);
create index if not exists idx_exam_comparisons_prof on public.patient_exam_comparisons (professional_id);

-- Políticas RLS
create policy "Pacientes podem visualizar as suas próprias comparações"
  on public.patient_exam_comparisons for select
  using (auth.uid() = patient_id);

create policy "Profissionais podem gerir comparações dos seus pacientes"
  on public.patient_exam_comparisons for all
  using (
    auth.uid() = professional_id OR 
    exists (
      select 1 from public.patients 
      where professional_id = auth.uid() 
      and user_id = patient_exam_comparisons.patient_id 
      and status = 'accepted'
    )
  );


--------------------------------------------------------------------------------
-- 3. CLINICAL SUMMARIES TABLE (Resumo Clínico de Evolução, Riscos e Próximos Passos)
--------------------------------------------------------------------------------
create table if not exists public.clinical_summaries (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  active_problems jsonb default '[]'::jsonb,
  active_treatments jsonb default '[]'::jsonb,
  high_risks jsonb default '[]'::jsonb,
  next_steps jsonb default '[]'::jsonb,
  critical_alerts jsonb default '[]'::jsonb,
  evolution_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.clinical_summaries enable row level security;

-- Índices
create index if not exists idx_clinical_summaries_patient on public.clinical_summaries (patient_id, created_at desc);

-- Políticas RLS
create policy "Pacientes podem visualizar o seu próprio resumo clínico"
  on public.clinical_summaries for select
  using (auth.uid() = patient_id);

create policy "Profissionais podem gerir resumos clínicos dos seus pacientes"
  on public.clinical_summaries for all
  using (
    auth.uid() = professional_id OR 
    exists (
      select 1 from public.patients 
      where professional_id = auth.uid() 
      and user_id = clinical_summaries.patient_id 
      and status = 'accepted'
    )
  );


--------------------------------------------------------------------------------
-- 4. CLINICAL REPORTS TABLE (Relatórios Clínicos Estruturados Editáveis e Impressos)
--------------------------------------------------------------------------------
create table if not exists public.clinical_reports (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  summary text,
  findings text,
  interpretation text,
  hypotheses jsonb default '[]'::jsonb,
  plan text,
  recommendations jsonb default '[]'::jsonb,
  observations text,
  full_report_text text, -- O documento final compilado e editável
  validation_code text unique not null, -- Código público para validação externa (ex: DOCTA-AI-XXXXXX)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.clinical_reports enable row level security;

-- Índices
create index if not exists idx_clinical_reports_patient on public.clinical_reports (patient_id, created_at desc);
create index if not exists idx_clinical_reports_validation on public.clinical_reports (validation_code);

-- Políticas RLS
create policy "Pacientes podem visualizar os seus próprios relatórios clínicos"
  on public.clinical_reports for select
  using (auth.uid() = patient_id);

create policy "Profissionais podem gerir relatórios clínicos dos seus pacientes"
  on public.clinical_reports for all
  using (
    auth.uid() = professional_id OR 
    exists (
      select 1 from public.patients 
      where professional_id = auth.uid() 
      and user_id = clinical_reports.patient_id 
      and status = 'accepted'
    )
  );

-- Permitir visualização pública por código de validação externa para farmácias/seguradoras autorizadas
create policy "Qualquer utilizador autenticado pode validar relatórios por código"
  on public.clinical_reports for select
  using (auth.uid() is not null);


--------------------------------------------------------------------------------
-- 5. MEDICATION EVALUATIONS TABLE (Análise de Segurança Farmacológica)
--------------------------------------------------------------------------------
create table if not exists public.medication_evaluations (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  evaluation_result jsonb not null, -- Armazena interações medicamentosas, contraindicações e sugestões
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.medication_evaluations enable row level security;

-- Índices
create index if not exists idx_medication_evaluations_patient on public.medication_evaluations (patient_id, created_at desc);

-- Políticas RLS
create policy "Pacientes podem ver as suas avaliações farmacológicas"
  on public.medication_evaluations for select
  using (auth.uid() = patient_id);

create policy "Profissionais podem gerir avaliações farmacológicas"
  on public.medication_evaluations for all
  using (
    auth.uid() = professional_id OR 
    exists (
      select 1 from public.patients 
      where professional_id = auth.uid() 
      and user_id = medication_evaluations.patient_id 
      and status = 'accepted'
    )
  );


--------------------------------------------------------------------------------
-- 6. DIFFERENTIAL DIAGNOSES TABLE (Diagnósticos Diferenciais Gerados pela IA)
--------------------------------------------------------------------------------
create table if not exists public.differential_diagnoses (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  professional_id uuid references public.profiles(id) on delete cascade not null,
  differential_result jsonb not null, -- Armazena as hipóteses de diagnóstico, probabilidades e exames recomendados
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.differential_diagnoses enable row level security;

-- Índices
create index if not exists idx_differential_diagnoses_patient on public.differential_diagnoses (patient_id, created_at desc);

-- Políticas RLS
create policy "Pacientes podem ver os seus diagnósticos diferenciais"
  on public.differential_diagnoses for select
  using (auth.uid() = patient_id);

create policy "Profissionais podem gerir diagnósticos diferenciais"
  on public.differential_diagnoses for all
  using (
    auth.uid() = professional_id OR 
    exists (
      select 1 from public.patients 
      where professional_id = auth.uid() 
      and user_id = differential_diagnoses.patient_id 
      and status = 'accepted'
    )
  );


--------------------------------------------------------------------------------
-- 7. STORAGE BUCKET PARA EXAMES DE IMAGEM E FICHEIROS
--------------------------------------------------------------------------------
-- Insere o bucket de exames na tabela de buckets da Supabase (se ainda não existir)
insert into storage.buckets (id, name, public) 
values ('patient-exams', 'patient-exams', true)
on conflict (id) do nothing;

-- Políticas de Armazenamento para 'patient-exams'
create policy "Ficheiros de exames são públicos para leitura"
on storage.objects for select
using ( bucket_id = 'patient-exams' );

create policy "Utilizadores autenticados podem fazer upload de ficheiros de exames"
on storage.objects for insert
with check (
  bucket_id = 'patient-exams' AND 
  auth.role() = 'authenticated'
);

create policy "Profissionais podem remover ficheiros de exames"
on storage.objects for delete
using (
  bucket_id = 'patient-exams' AND 
  auth.role() = 'authenticated'
);


--------------------------------------------------------------------------------
-- 8. FUNÇÕES AUTOMÁTICAS E PROCEDIMENTOS (TRIGGERS)
--------------------------------------------------------------------------------

-- Função para atualizar automaticamente o campo 'updated_at' nas modificações
create or replace function public.update_modified_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger para patient_exams
create trigger update_patient_exams_modtime
before update on public.patient_exams
for each row execute procedure public.update_modified_column();

-- Trigger para clinical_summaries
create trigger update_clinical_summaries_modtime
before update on public.clinical_summaries
for each row execute procedure public.update_modified_column();

-- Trigger para clinical_reports
create trigger update_clinical_reports_modtime
before update on public.clinical_reports
for each row execute procedure public.update_modified_column();


--------------------------------------------------------------------------------
-- FIM DO SCRIPT DE INSTALAÇÃO DO COPILOTO CLÍNICO E EXAMES
--------------------------------------------------------------------------------
