-- ============================================================
-- SCRIPT 3 DE 5 — Crear políticas RLS
-- Abogado-Sala: FR-01 Seguridad
-- ============================================================
-- DÓNDE PEGAR: Supabase Dashboard → SQL Editor → New Query
-- QUÉ HACE: Habilita RLS y crea políticas de seguridad para
--           legal_areas y legal_area_stages.
-- RIESGO: NULO — solo agrega seguridad.
-- REVERSIBLE: SÍ — DROP POLICY + ALTER TABLE DISABLE ROW LEVEL SECURITY.
-- PREREQUISITO: Script 1 ejecutado correctamente.
-- ============================================================

-- ── Habilitar RLS ──
ALTER TABLE public.legal_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_area_stages ENABLE ROW LEVEL SECURITY;

-- ── legal_areas: miembros leen, admins gestionan ──
CREATE POLICY "la_select" ON public.legal_areas
  FOR SELECT
  USING (org_id = app_get_org_id() AND app_is_active());

CREATE POLICY "la_insert" ON public.legal_areas
  FOR INSERT
  WITH CHECK (org_id = app_get_org_id() AND app_is_admin());

CREATE POLICY "la_update" ON public.legal_areas
  FOR UPDATE
  USING (org_id = app_get_org_id() AND app_is_admin());

CREATE POLICY "la_delete" ON public.legal_areas
  FOR DELETE
  USING (org_id = app_get_org_id() AND app_is_admin() AND is_system = false);

-- ── legal_area_stages: lectura via join, gestión solo admins ──
CREATE POLICY "las_select" ON public.legal_area_stages
  FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM public.legal_areas la
    WHERE la.id = legal_area_stages.legal_area_id
      AND la.org_id = app_get_org_id()
  ));

CREATE POLICY "las_insert" ON public.legal_area_stages
  FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.legal_areas la
    WHERE la.id = legal_area_stages.legal_area_id
      AND la.org_id = app_get_org_id()
      AND app_is_admin()
  ));

CREATE POLICY "las_update" ON public.legal_area_stages
  FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.legal_areas la
    WHERE la.id = legal_area_stages.legal_area_id
      AND la.org_id = app_get_org_id()
      AND app_is_admin()
  ));

CREATE POLICY "las_delete" ON public.legal_area_stages
  FOR DELETE
  USING (EXISTS(
    SELECT 1 FROM public.legal_areas la
    WHERE la.id = legal_area_stages.legal_area_id
      AND la.org_id = app_get_org_id()
      AND app_is_admin()
  ));

-- ============================================================
-- VERIFICACIÓN:
-- ============================================================
-- SELECT schemaname, tablename, policyname FROM pg_policies
-- WHERE tablename IN ('legal_areas','legal_area_stages');
-- Resultado esperado: 8 políticas (4 para legal_areas, 4 para legal_area_stages)
