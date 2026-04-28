-- ============================================================
-- SCRIPT 5 DE 5 — Verificación completa
-- Abogado-Sala: FR-01 + FR-02 Post-migración
-- ============================================================
-- DÓNDE PEGAR: Supabase Dashboard → SQL Editor → New Query
-- QUÉ HACE: Queries de solo lectura para verificar que todo está OK.
-- RIESGO: CERO — solo SELECT, no modifica nada.
-- ============================================================

-- 1. Verificar que las tablas existen
SELECT '✅ TABLAS' AS check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('legal_areas', 'legal_area_stages')
ORDER BY table_name;

-- 2. Verificar que las columnas nuevas existen en cases
SELECT '✅ COLUMNAS EN CASES' AS check_type, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cases' 
  AND column_name IN ('legal_area_id', 'stage_id');

-- 3. Verificar que las funciones RPC existen
SELECT '✅ FUNCIONES RPC' AS check_type, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('seed_default_legal_areas', 'update_case_stage');

-- 4. Verificar que las políticas RLS están activas
SELECT '✅ POLÍTICAS RLS' AS check_type, tablename, policyname
FROM pg_policies
WHERE tablename IN ('legal_areas', 'legal_area_stages')
ORDER BY tablename, policyname;

-- 5. Verificar el seeder — materias y etapas por organización
SELECT 
  o.name AS organizacion,
  la.name AS materia,
  string_agg(las.name, ' → ' ORDER BY las.display_order) AS etapas
FROM public.organizations o
JOIN public.legal_areas la ON la.org_id = o.id
JOIN public.legal_area_stages las ON las.legal_area_id = la.id
GROUP BY o.name, la.name, la.display_order
ORDER BY o.name, la.display_order;

-- 6. Verificar migración de datos de expedientes
SELECT 
  COUNT(*) AS total_cases,
  COUNT(*) FILTER (WHERE legal_area_id IS NOT NULL) AS con_materia_fk,
  COUNT(*) FILTER (WHERE stage_id IS NOT NULL) AS con_etapa_fk,
  COUNT(*) FILTER (WHERE legal_area_id IS NULL AND legal_area IS NOT NULL) AS sin_migrar,
  COUNT(*) FILTER (WHERE legal_area IS NULL) AS sin_materia
FROM public.cases;

-- 7. Verificar integridad del CHECK de case_updates
SELECT '✅ CHECK CONSTRAINT' AS check_type, constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'case_updates_type_check';

-- 8. Verificar que "Detenido" no existe en la BD (FR-02)
-- (Este check es sobre los datos, no sobre el código — el código ya está limpio)
SELECT '✅ NO HAY DETENIDO' AS check_type, 
  COUNT(*) FILTER (WHERE type = 'status_change' AND body LIKE '%Detenido%') AS refs_detenido
FROM public.case_updates;
