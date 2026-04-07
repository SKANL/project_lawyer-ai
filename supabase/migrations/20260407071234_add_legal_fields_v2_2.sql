-- Migración V2.2: Campos Legales y Flexibilidad (CRM + Expedientes)
-- Fecha: 2026-04-07

-- 1. Nuevos Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
        CREATE TYPE public.client_type AS ENUM ('individual', 'company');
    END IF;
END $$;

-- 2. Ampliación de case_status (para un Kanban más completo)
-- Nota: Postgres no permite ALTER TYPE ADD VALUE dentro de una transacción en versiones antiguas,
-- pero Supabase (Postgres 15+) lo soporta.
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'pending_docs';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 3. Actualización de la tabla public.clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS type public.client_type NOT NULL DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 4. Actualización de la tabla public.cases
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS official_id text,          -- No. de Expediente Oficial
ADD COLUMN IF NOT EXISTS court_name text,            -- Juzgado / Tribunal
ADD COLUMN IF NOT EXISTS legal_area text,            -- Materia (Familiar, Civil, etc)
ADD COLUMN IF NOT EXISTS legal_action text,          -- Acción (Juicio Ordinario, etc)
ADD COLUMN IF NOT EXISTS opposition_party text,      -- Contraparte
ADD COLUMN IF NOT EXISTS start_date date,            -- Fecha de Inicio
ADD COLUMN IF NOT EXISTS end_date date,              -- Fecha Fin Estimada
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb; -- Campos personalizados ("Otros")

-- 5. Comentarios para Documentación
COMMENT ON COLUMN public.cases.official_id IS 'Número de expediente oficial ante la autoridad judicial.';
COMMENT ON COLUMN public.cases.metadata IS 'Campos personalizados dinámicos (Otros) almacenados como JSONB.';
COMMENT ON COLUMN public.clients.metadata IS 'Campos personalizados dinámicos para el cliente.';
