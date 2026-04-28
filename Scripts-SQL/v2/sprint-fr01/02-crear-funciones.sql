-- ============================================================
-- SCRIPT 2 DE 5 — Crear funciones RPC + seeder
-- Abogado-Sala: FR-01 + FR-02
-- ============================================================
-- DÓNDE PEGAR: Supabase Dashboard → SQL Editor → New Query
-- QUÉ HACE: Crea la función seeder de materias y la función
--           RPC de cambio de etapa con audit trail + idempotencia.
-- RIESGO: NULO — solo crea funciones, no modifica datos.
-- REVERSIBLE: SÍ — DROP FUNCTION seed_default_legal_areas; DROP FUNCTION update_case_stage;
-- PREREQUISITO: Script 1 ejecutado correctamente.
-- ============================================================

-- ── Seeder: Poblar materias legales estándar para una organización ──
CREATE OR REPLACE FUNCTION public.seed_default_legal_areas(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_area_id UUID;
BEGIN
  -- Solo ejecutar si la org no tiene materias aún (idempotente)
  IF EXISTS (SELECT 1 FROM public.legal_areas WHERE org_id = p_org_id) THEN
    RETURN;
  END IF;

  -- Penal (terminología CNPP vigente, validada con Abogado Carlos R.)
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Penal', 'penal', 1, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Carpeta de Investigación', 'carpeta_investigacion', 1, 'amber'),
    (v_area_id, 'Juzgado', 'juzgado', 2, 'primary'),
    (v_area_id, 'Sentencia', 'sentencia', 3, 'emerald');

  -- Civil
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Civil', 'civil', 2, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Demanda', 'demanda', 1, 'amber'),
    (v_area_id, 'En Trámite', 'en_tramite', 2, 'primary'),
    (v_area_id, 'Sentencia', 'sentencia', 3, 'emerald');

  -- Familiar
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Familiar', 'familiar', 3, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Demanda', 'demanda', 1, 'amber'),
    (v_area_id, 'En Trámite', 'en_tramite', 2, 'primary'),
    (v_area_id, 'Sentencia', 'sentencia', 3, 'emerald');

  -- Mercantil
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Mercantil', 'mercantil', 4, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Inicio', 'inicio', 1, 'amber'),
    (v_area_id, 'En Trámite', 'en_tramite', 2, 'primary'),
    (v_area_id, 'Resolución', 'resolucion', 3, 'emerald');

  -- Laboral
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Laboral', 'laboral', 5, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Inicio', 'inicio', 1, 'amber'),
    (v_area_id, 'En Trámite', 'en_tramite', 2, 'primary'),
    (v_area_id, 'Resolución', 'resolucion', 3, 'emerald');

  -- Administrativo
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Administrativo', 'administrativo', 6, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Inicio', 'inicio', 1, 'amber'),
    (v_area_id, 'En Trámite', 'en_tramite', 2, 'primary'),
    (v_area_id, 'Resolución', 'resolucion', 3, 'emerald');

  -- Amparo
  INSERT INTO public.legal_areas(org_id, name, slug, display_order, is_system)
    VALUES(p_org_id, 'Amparo', 'amparo', 7, true) RETURNING id INTO v_area_id;
  INSERT INTO public.legal_area_stages(legal_area_id, name, slug, display_order, color) VALUES
    (v_area_id, 'Inicio', 'inicio', 1, 'amber'),
    (v_area_id, 'En Trámite', 'en_tramite', 2, 'primary'),
    (v_area_id, 'Resolución', 'resolucion', 3, 'emerald');
END;
$$;

COMMENT ON FUNCTION public.seed_default_legal_areas IS 'Pobla materias legales estándar MX para una organización nueva. Idempotente.';


-- ── RPC: Cambio de etapa procesal con audit trail (FR-02) ──
CREATE OR REPLACE FUNCTION public.update_case_stage(
  p_case_id      UUID,
  p_new_stage_id UUID,
  p_reason       TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_stage_name TEXT;
  v_new_stage_name TEXT;
  v_org_id         UUID;
  v_case_area_id   UUID;
  v_stage_area_id  UUID;
  v_current_stage  UUID;
BEGIN
  -- 1. Obtener info actual del expediente
  SELECT c.org_id, c.stage_id, c.legal_area_id, COALESCE(las.name, c.status::text)
    INTO v_org_id, v_current_stage, v_case_area_id, v_old_stage_name
  FROM public.cases c
  LEFT JOIN public.legal_area_stages las ON c.stage_id = las.id
  WHERE c.id = p_case_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found: %', p_case_id;
  END IF;

  -- 2. Obtener info del nuevo stage
  SELECT las.name, las.legal_area_id
    INTO v_new_stage_name, v_stage_area_id
  FROM public.legal_area_stages las
  WHERE las.id = p_new_stage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stage not found: %', p_new_stage_id;
  END IF;

  -- 3. Validar que el stage pertenece a la materia del expediente
  IF v_case_area_id IS NOT NULL AND v_stage_area_id != v_case_area_id THEN
    RAISE EXCEPTION 'Stage % does not belong to legal area % of case %',
      p_new_stage_id, v_case_area_id, p_case_id;
  END IF;

  -- 4. IDEMPOTENCIA: si el stage no cambió, no hacer nada
  IF v_current_stage = p_new_stage_id THEN
    RETURN;
  END IF;

  -- 5. Actualizar el expediente (transacción ACID implícita en PL/pgSQL)
  UPDATE public.cases
  SET stage_id = p_new_stage_id,
      legal_area_id = COALESCE(legal_area_id, v_stage_area_id),
      updated_at = now()
  WHERE id = p_case_id;

  -- 6. Registrar en audit trail (case_updates con type = 'status_change')
  INSERT INTO public.case_updates(case_id, org_id, author_id, type, title, body) VALUES (
    p_case_id,
    v_org_id,
    auth.uid(),
    'status_change',
    'Cambio de etapa procesal',
    format('De "%s" a "%s". Motivo: %s',
      COALESCE(v_old_stage_name, 'Sin asignar'),
      v_new_stage_name,
      COALESCE(p_reason, '—'))
  );
END;
$$;

COMMENT ON FUNCTION public.update_case_stage IS 'Cambia la etapa procesal de un expediente con audit trail inmutable e idempotencia. Transacción ACID.';

-- ============================================================
-- VERIFICACIÓN:
-- ============================================================
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name IN ('seed_default_legal_areas','update_case_stage');
-- Resultado esperado: 2 filas
