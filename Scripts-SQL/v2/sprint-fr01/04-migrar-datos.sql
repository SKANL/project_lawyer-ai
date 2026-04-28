-- ============================================================
-- SCRIPT 4 DE 5 — Migrar datos existentes
-- Abogado-Sala: FR-01 Migración de datos legacy
-- ============================================================
-- DÓNDE PEGAR: Supabase Dashboard → SQL Editor → New Query
-- QUÉ HACE: 
--   1. Ejecuta el seeder para TODAS las organizaciones existentes
--   2. Mapea legal_area TEXT → legal_area_id FK
--   3. Asigna stage_id por defecto a expedientes migrados
-- RIESGO: BAJO — solo escribe en columnas NUEVAS (las viejas no se tocan)
-- REVERSIBLE: SÍ — UPDATE cases SET legal_area_id = NULL, stage_id = NULL;
-- PREREQUISITO: Scripts 1, 2 y 3 ejecutados correctamente.
-- ============================================================

-- ── Paso 1: Ejecutar seeder para TODAS las organizaciones existentes ──
-- Solo seedea organizaciones que aún no tienen legal_areas
DO $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  FOR r IN SELECT id, name FROM public.organizations LOOP
    IF NOT EXISTS (SELECT 1 FROM public.legal_areas WHERE org_id = r.id) THEN
      PERFORM public.seed_default_legal_areas(r.id);
      v_count := v_count + 1;
      RAISE NOTICE 'Seeded legal areas for org: % (%)', r.name, r.id;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ Total organizaciones procesadas: %', v_count;
END;
$$;

-- ── Paso 2: Mapear legal_area TEXT existente → legal_area_id FK ──
-- Usa comparación case-insensitive para tolerancia a mayúsculas/minúsculas
UPDATE public.cases c
SET legal_area_id = la.id
FROM public.legal_areas la
WHERE c.legal_area IS NOT NULL
  AND c.legal_area_id IS NULL
  AND la.org_id = c.org_id
  AND LOWER(TRIM(la.name)) = LOWER(TRIM(c.legal_area));

-- ── Paso 3: Asignar primer stage como default para expedientes migrados ──
-- El abogado puede reclasificar manualmente después desde el UI
UPDATE public.cases c
SET stage_id = (
  SELECT las.id
  FROM public.legal_area_stages las
  WHERE las.legal_area_id = c.legal_area_id
  ORDER BY las.display_order ASC
  LIMIT 1
)
WHERE c.legal_area_id IS NOT NULL
  AND c.stage_id IS NULL;

-- ============================================================
-- VERIFICACIÓN (ejecutar por separado):
-- ============================================================
-- SELECT 
--   COUNT(*) AS total_cases,
--   COUNT(*) FILTER (WHERE legal_area_id IS NOT NULL) AS migrated,
--   COUNT(*) FILTER (WHERE legal_area_id IS NULL AND legal_area IS NOT NULL) AS unmatched,
--   COUNT(*) FILTER (WHERE legal_area IS NULL) AS no_area,
--   COUNT(*) FILTER (WHERE stage_id IS NOT NULL) AS with_stage
-- FROM public.cases;
--
-- INTERPRETACIÓN:
-- • migrated = expedientes que se conectaron correctamente a la nueva tabla
-- • unmatched = expedientes con legal_area texto que no matcheó (typos, "Otro", etc.)
--   → Estos siguen funcionando con el campo legacy, el abogado los reclasifica en el UI
-- • no_area = expedientes sin materia legal asignada (normal para borradores)
-- • with_stage = expedientes con etapa procesal asignada
