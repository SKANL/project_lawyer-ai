-- ============================================================
-- SCRIPT 1 DE 5 — Crear tablas + modificar cases
-- Abogado-Sala: FR-01 Estados Dinámicos
-- ============================================================
-- DÓNDE PEGAR: Supabase Dashboard → SQL Editor → New Query
-- QUÉ HACE: Crea las tablas legal_areas y legal_area_stages,
--           agrega columnas legal_area_id y stage_id a cases,
--           y amplía el CHECK de case_updates.type.
-- RIESGO: NULO — solo crea estructuras nuevas, no toca datos.
-- REVERSIBLE: SÍ — DROP TABLE legal_area_stages; DROP TABLE legal_areas;
--             ALTER TABLE cases DROP COLUMN IF EXISTS legal_area_id, DROP COLUMN IF EXISTS stage_id;
-- ============================================================

-- ── legal_areas — Catálogo de materias legales (multi-tenant) ──
CREATE TABLE IF NOT EXISTS public.legal_areas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_system     BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, slug)
);

COMMENT ON TABLE public.legal_areas IS 'Catálogo de materias legales por organización (Penal, Civil, Familiar, etc.)';

-- ── legal_area_stages — Etapas procesales por materia ──
CREATE TABLE IF NOT EXISTS public.legal_area_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_area_id   UUID NOT NULL REFERENCES public.legal_areas(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  display_order   INT DEFAULT 0,
  color           TEXT DEFAULT 'primary',
  is_terminal     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  UNIQUE(legal_area_id, slug)
);

COMMENT ON TABLE public.legal_area_stages IS 'Etapas procesales dinámicas por materia legal (ej: Carpeta de Investigación → Juzgado → Sentencia para Penal)';

-- ── Modificar cases — Agregar FK a las nuevas tablas ──
-- NOTA: NO elimina las columnas status ni legal_area existentes
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS legal_area_id UUID REFERENCES public.legal_areas(id),
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.legal_area_stages(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.cases.legal_area_id IS 'FK a catálogo de materias dinámico (complementa legal_area TEXT legacy)';
COMMENT ON COLUMN public.cases.stage_id IS 'FK a etapa procesal dinámica (complementa status enum legacy)';

-- ── Ampliar CHECK de case_updates.type para incluir 'status_change' ──
ALTER TABLE public.case_updates DROP CONSTRAINT IF EXISTS case_updates_type_check;
ALTER TABLE public.case_updates ADD CONSTRAINT case_updates_type_check
  CHECK (type = ANY(ARRAY['info','milestone','warning','document_request','status_change']));

-- ============================================================
-- VERIFICACIÓN: Ejecuta esto después para confirmar que funcionó
-- ============================================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('legal_areas','legal_area_stages');
-- Resultado esperado: 2 filas (legal_areas, legal_area_stages)
--
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'cases' AND column_name IN ('legal_area_id','stage_id');
-- Resultado esperado: 2 filas (legal_area_id, stage_id)
