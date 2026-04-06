-- ============================================================
-- 04-functions.sql — Abogado-Sala V2
-- Funciones auxiliares del proyecto
-- Ejecutar DESPUÉS de 02-tables.sql
-- ============================================================
-- Best practices (skill):
--   - SECURITY DEFINER con SET search_path TO 'public'
--   - auth.uid() envuelto en (SELECT auth.uid()) en RLS para cache
--   - STABLE en funciones de solo lectura
-- ============================================================

-- ── Helper: obtener org_id del JWT o fallback desde profiles ─
CREATE OR REPLACE FUNCTION public.app_get_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _claims jsonb;
  _org_id uuid;
BEGIN
  _claims := current_setting('request.jwt.claims', true)::jsonb;
  _org_id := (_claims -> 'app_metadata' ->> 'org_id')::uuid;
  IF _org_id IS NOT NULL THEN RETURN _org_id; END IF;
  SELECT org_id INTO _org_id FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(_org_id, '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;

-- ── Helper: verificar si el usuario tiene rol admin/owner ─────
CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _claims jsonb;
  _role   text;
BEGIN
  _claims := current_setting('request.jwt.claims', true)::jsonb;
  _role   := _claims -> 'app_metadata' ->> 'role';
  -- Fast path: role en JWT (sin round-trip a DB)
  IF _role IS NOT NULL THEN
    RETURN _role IN ('admin', 'owner');
  END IF;
  -- Fallback: JWT no se ha refrescado tras cambio de rol
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id   = auth.uid()
      AND role IN ('admin', 'owner')
  );
END;
$$;

-- ── Helper: verificar si el usuario tiene rol owner ───────────
CREATE OR REPLACE FUNCTION public.app_is_owner()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _claims jsonb;
  _role   text;
BEGIN
  _claims := current_setting('request.jwt.claims', true)::jsonb;
  _role   := _claims -> 'app_metadata' ->> 'role';
  IF _role IS NOT NULL THEN RETURN _role = 'owner'; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$;

-- ── Helper: verificar si el usuario está activo ────────────────
CREATE OR REPLACE FUNCTION public.app_is_active()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id     = auth.uid()
      AND status = 'active'
  );
$$;

-- ── Helper: verificar si es un cliente del portal ─────────────
CREATE OR REPLACE FUNCTION public.app_is_client()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::text, '') = 'client';
$$;

-- ── Helper: obtener client_id del JWT ─────────────────────────
CREATE OR REPLACE FUNCTION public.app_get_client_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NULLIF((auth.jwt() -> 'app_metadata' ->> 'client_id'), '')::uuid;
$$;

-- ── Trigger: set updated_at genérico ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Trigger: sincronizar claims al JWT en auth.users ──────────
CREATE OR REPLACE FUNCTION public.sync_claims_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'org_id', NEW.org_id,
      'role',   NEW.role
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ── Trigger: crear perfil automáticamente al registrarse ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_role   user_role := 'member';
BEGIN
  -- Buscar si hay una invitación pendiente para este email
  SELECT org_id, role
  INTO   v_org_id, v_role
  FROM   public.invitations
  WHERE  email  = NEW.email
    AND  status = 'pending'
  FOR UPDATE LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    UPDATE public.invitations
    SET    status = 'accepted'
    WHERE  email  = NEW.email
      AND  status = 'pending';

    IF NOT FOUND THEN
      v_org_id := NULL;
      v_role   := 'member';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, org_id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    v_org_id,
    COALESCE(v_role, 'member'),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN not_null_violation THEN RETURN NEW;
  WHEN others             THEN RETURN NEW;
END;
$$;

-- ── Trigger: verificar suscripción activa ─────────────────────
CREATE OR REPLACE FUNCTION public.ensure_active_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status        plan_status;
  v_trial_ends_at timestamptz;
BEGIN
  SELECT plan_status, trial_ends_at
  INTO   v_status, v_trial_ends_at
  FROM   organizations
  WHERE  id = NEW.org_id;

  IF v_status = 'trialing' AND v_trial_ends_at < NOW() THEN
    RAISE EXCEPTION USING
      ERRCODE = 'BLQUS',
      MESSAGE = 'BILLING_TRIAL_EXPIRED';
  END IF;

  IF v_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'BLQUS',
      MESSAGE = 'BILLING_SUBSCRIPTION_INACTIVE';
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger: verificar cuotas del plan ────────────────────────
CREATE OR REPLACE FUNCTION public.check_org_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_tier     plan_tier;
  v_plan_status   plan_status;
  v_count         int;
  v_limit         int;
  v_lock_key      bigint;
  v_trial_ends_at timestamptz;
  v_org_id        uuid;
  v_new_json      jsonb;
BEGIN
  v_new_json := row_to_json(NEW);

  IF v_new_json ? 'org_id' THEN
    v_org_id := (v_new_json ->> 'org_id')::uuid;
  ELSE
    RETURN NEW;
  END IF;

  IF v_org_id IS NULL THEN RETURN NEW; END IF;

  -- Advisory lock por org para evitar race conditions en cuotas
  v_lock_key := hashtext('quota_' || v_org_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT o.plan_tier, o.plan_status, o.trial_ends_at, pc.max_clients, pc.max_members
  INTO   v_plan_tier, v_plan_status, v_trial_ends_at, v_limit, v_limit
  FROM   organizations o
  LEFT JOIN plan_configs pc ON o.plan_tier = pc.plan
  WHERE  o.id = v_org_id;

  -- Guard: trial expirado
  IF v_plan_status = 'trialing'
     AND v_trial_ends_at IS NOT NULL
     AND v_trial_ends_at < NOW()
  THEN
    UPDATE public.organizations SET plan_status = 'expired' WHERE id = v_org_id;
    RAISE EXCEPTION USING
      ERRCODE = 'BLTEX',
      MESSAGE = 'BILLING_TRIAL_EXPIRED';
  END IF;

  -- Guard: plan inactivo
  IF v_plan_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'BLSUB',
      MESSAGE = 'BILLING_SUBSCRIPTION_INACTIVE';
  END IF;

  IF v_limit IS NULL THEN v_limit := 10; END IF;

  -- Verificar cuota de clientes
  IF TG_TABLE_NAME = 'clients' THEN
    SELECT max_clients INTO v_limit
    FROM plan_configs
    JOIN organizations o ON o.plan_tier = plan_configs.plan
    WHERE o.id = v_org_id;
    IF v_limit IS NULL THEN v_limit := 10; END IF;

    SELECT count(*) INTO v_count FROM clients WHERE org_id = v_org_id;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION USING
        ERRCODE = 'BLQCL',
        MESSAGE = 'BILLING_QUOTA_CLIENTS';
    END IF;
  END IF;

  -- Verificar cuota de miembros (profiles)
  IF TG_TABLE_NAME = 'profiles' THEN
    SELECT max_members INTO v_limit
    FROM plan_configs
    JOIN organizations o ON o.plan_tier = plan_configs.plan
    WHERE o.id = v_org_id;
    IF v_limit IS NULL THEN v_limit := 1; END IF;

    SELECT count(*) INTO v_count
    FROM profiles
    WHERE org_id = v_org_id AND status = 'active';
    IF v_count >= v_limit THEN
      RAISE EXCEPTION USING
        ERRCODE = 'BLQMB',
        MESSAGE = 'BILLING_QUOTA_MEMBERS';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger: actualizar uso de storage ───────────────────────
CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_delta         bigint;
  v_org_id        uuid;
  v_lock_key      bigint;
  v_new_json      jsonb;
  v_old_json      jsonb;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    v_new_json := row_to_json(NEW);
    IF NOT (v_new_json ? 'org_id') THEN RETURN NULL; END IF;
  END IF;

  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    v_old_json := row_to_json(OLD);
    IF NOT (v_old_json ? 'org_id') THEN RETURN NULL; END IF;
  END IF;

  IF    (TG_OP = 'INSERT') THEN
    v_delta  := COALESCE((v_new_json ->> 'file_size')::bigint, 0);
    v_org_id := (v_new_json ->> 'org_id')::uuid;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_delta  := COALESCE((v_new_json ->> 'file_size')::bigint, 0)
              - COALESCE((v_old_json ->> 'file_size')::bigint, 0);
    v_org_id := (v_new_json ->> 'org_id')::uuid;
  ELSIF (TG_OP = 'DELETE') THEN
    v_delta  := -COALESCE((v_old_json ->> 'file_size')::bigint, 0);
    v_org_id := (v_old_json ->> 'org_id')::uuid;
  END IF;

  IF v_delta = 0 THEN RETURN NULL; END IF;
  IF v_org_id IS NULL THEN RETURN NULL; END IF;

  v_lock_key := hashtext('storage_quota_' || v_org_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  UPDATE organizations
  SET    storage_used = storage_used + v_delta
  WHERE  id = v_org_id;

  RETURN NULL;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- ── Trigger: encolar eliminación de archivo en storage ────────
CREATE OR REPLACE FUNCTION public.queue_storage_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.file_key IS NOT NULL THEN
    INSERT INTO storage_delete_queue (bucket_id, file_path)
    VALUES ('case-files', OLD.file_key);
  END IF;
  RETURN OLD;
END;
$$;

-- ── Trigger: generar archivos desde template_snapshot ─────────
CREATE OR REPLACE FUNCTION public.generate_files_for_case(
  p_case_id           uuid,
  p_org_id            uuid,
  p_template_snapshot jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key   text;
  v_field jsonb;
BEGIN
  IF p_template_snapshot IS NULL OR p_template_snapshot = '{}'::jsonb THEN
    RETURN;
  END IF;

  FOR v_key, v_field IN SELECT * FROM jsonb_each(p_template_snapshot)
  LOOP
    IF (v_field ->> 'type') = 'file' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.case_files
        WHERE case_id     = p_case_id
          AND description = (v_field ->> 'label')
      ) THEN
        INSERT INTO public.case_files (org_id, case_id, category, description, status, updated_at)
        VALUES (p_org_id, p_case_id, 'other', v_field ->> 'label', 'pending', NOW());
      END IF;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_files_from_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.generate_files_for_case(NEW.id, NEW.org_id, NEW.template_snapshot);
  RETURN NEW;
END;
$$;

-- ── Trigger: auditoría genérica ───────────────────────────────
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_json jsonb;
  v_old_json jsonb;
  v_org_id   uuid;
BEGIN
  v_new_json := NULL;
  v_old_json := NULL;

  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    v_new_json := row_to_json(NEW);
  END IF;

  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    v_old_json := row_to_json(OLD);
  END IF;

  IF v_new_json ? 'org_id' THEN
    v_org_id := (v_new_json ->> 'org_id')::uuid;
  ELSIF v_old_json ? 'org_id' THEN
    v_org_id := (v_old_json ->> 'org_id')::uuid;
  ELSE
    v_org_id := NULL;
  END IF;

  INSERT INTO audit_logs (org_id, actor_id, action, target_id, metadata)
  VALUES (
    v_org_id,
    auth.uid(),
    TG_TABLE_NAME || '_' || TG_OP,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old',          v_old_json,
      'new',          v_new_json,
      'triggered_by', current_user
    )
  );
  RETURN NULL;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- ── Trigger: prevenir eliminación del último admin ────────────
CREATE OR REPLACE FUNCTION public.prevent_last_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_count int;
BEGIN
  IF OLD.role IN ('admin', 'owner') THEN
    SELECT count(*) INTO v_admin_count
    FROM   public.profiles
    WHERE  org_id = OLD.org_id AND role IN ('admin', 'owner');

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION USING
        ERRCODE = 'INTEG',
        MESSAGE = 'AUTH_LAST_ADMIN';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

-- ── Trigger: verificar que el abogado pertenece a la misma org
CREATE OR REPLACE FUNCTION public.check_lawyer_org_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assigned_lawyer_id IS NOT NULL THEN
    PERFORM 1 FROM profiles
    WHERE id = NEW.assigned_lawyer_id AND org_id = NEW.org_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Integrity Violation: Assigned lawyer must belong to the same organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Trigger: sincronizar state de suscripción con la org ──────
CREATE OR REPLACE FUNCTION public.sync_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE organizations
  SET    plan_status = CASE
           WHEN NEW.status = 'active'               THEN 'active'::plan_status
           WHEN NEW.status = 'trialing'             THEN 'trialing'::plan_status
           WHEN NEW.status IN ('past_due','unpaid') THEN 'past_due'::plan_status
           ELSE 'canceled'::plan_status
         END,
         updated_at = NOW()
  WHERE  id = NEW.org_id;
  RETURN NEW;
END;
$$;

-- ── Trigger: crear org_settings al crear organización ─────────
-- V2: cada organización tiene su fila de settings desde el inicio
CREATE OR REPLACE FUNCTION public.initialize_org_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.org_settings (org_id, settings)
  VALUES (NEW.id, jsonb_build_object(
    'timezone', 'America/Mexico_City',
    'whatsapp_template', 'Hola {client_name} 👋, te compartimos el enlace para acceder a tu expediente en el portal de *{org_name}*:' || E'\n\n' || '{link}' || E'\n\n' || 'Por favor revisa los documentos y completa la información solicitada. ¡Estamos para apoyarte!',
    'clause_library', '[]'::jsonb
  ))
  ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── Trigger: webhook para procesar zip jobs ───────────────────
-- ⚠️ PROJECT REF: ytvmdjnxdvzjiuuizijt
CREATE OR REPLACE FUNCTION public.trigger_process_zip_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url     := 'https://ytvmdjnxdvzjiuuizijt.supabase.co/functions/v1/process-zip-job',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;
  RETURN NEW;
END;
$$;

-- ── RPC: obtener caso por token (portal público) ──────────────
CREATE OR REPLACE FUNCTION public.get_case_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case        public.cases;
  v_client_name text;
  v_files       jsonb;
  v_org         jsonb;
BEGIN
  SELECT * INTO v_case FROM public.cases WHERE token = p_token;

  IF v_case IS NULL THEN
    RAISE EXCEPTION 'Case not found or invalid token';
  END IF;

  IF v_case.expires_at < now() THEN
    RAISE EXCEPTION 'Link expired';
  END IF;

  SELECT full_name INTO v_client_name FROM public.clients WHERE id = v_case.client_id;

  SELECT jsonb_build_object('name', o.name, 'logo_url', o.logo_url, 'primary_color', o.primary_color)
  INTO   v_org
  FROM   public.organizations o
  WHERE  o.id = v_case.org_id;

  SELECT jsonb_agg(jsonb_build_object(
    'id',               cf.id,
    'category',         cf.category,
    'description',      cf.description,
    'status',           cf.status,
    'exception_reason', cf.exception_reason,
    'review_note',      cf.review_note
  )) INTO v_files
  FROM public.case_files cf
  WHERE cf.case_id = v_case.id;

  RETURN jsonb_build_object(
    'case',        row_to_json(v_case),
    'client_name', v_client_name,
    'files',       COALESCE(v_files, '[]'::jsonb),
    'org',         v_org
  );
END;
$$;

-- ── RPC: obtener actualizaciones del caso por token ───────────
CREATE OR REPLACE FUNCTION public.get_case_updates_by_token(p_token text)
RETURNS TABLE(
  id          uuid,
  title       text,
  body        text,
  type        text,
  author_name text,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cu.id,
    cu.title,
    cu.body,
    cu.type,
    p.full_name  AS author_name,
    cu.created_at
  FROM   public.case_updates cu
  LEFT JOIN public.profiles p ON p.id = cu.author_id
  JOIN  public.cases c        ON c.id = cu.case_id
  WHERE c.token = p_token
  ORDER BY cu.created_at DESC;
END;
$$;

-- ── RPC: validar enlace de portal ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_case_validation(p_token text)
RETURNS TABLE(
  found           boolean,
  org_name        text,
  org_logo_url    text,
  client_name     text,
  case_status     text,
  case_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    true                AS found,
    o.name             AS org_name,
    o.logo_url         AS org_logo_url,
    c.full_name        AS client_name,
    cse.status::text   AS case_status,
    cse.created_at     AS case_created_at
  FROM   cases cse
  JOIN   organizations o ON o.id = cse.org_id
  JOIN   clients c       ON c.id = cse.client_id
  WHERE  cse.token = p_token;
END;
$$;

-- ── RPC: actualizar progreso desde el portal ──────────────────
CREATE OR REPLACE FUNCTION public.update_case_progress(p_token text, p_step_index integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case_id uuid;
BEGIN
  IF p_step_index < 0 THEN
    RAISE EXCEPTION 'Invalid Step Index: Cannot be negative';
  END IF;

  SELECT id INTO v_case_id
  FROM   public.cases
  WHERE  token = p_token AND expires_at > now();

  IF v_case_id IS NULL THEN RETURN; END IF;

  UPDATE public.cases
  SET    current_step_index = p_step_index, updated_at = now()
  WHERE  id = v_case_id;
END;
$$;

-- ── RPC: marcar excepción en archivo desde portal ─────────────
CREATE OR REPLACE FUNCTION public.flag_file_exception(p_token text, p_file_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case_id uuid;
BEGIN
  SELECT id INTO v_case_id FROM public.cases WHERE token = p_token AND expires_at > now();

  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or Expired Link';
  END IF;

  UPDATE public.case_files
  SET    status           = 'pending',
         exception_reason = p_reason,
         updated_at       = now()
  WHERE  id      = p_file_id
    AND  case_id = v_case_id;
END;
$$;

-- ── RPC: confirmar upload desde panel de abogados ─────────────
CREATE OR REPLACE FUNCTION public.confirm_file_upload(
  p_file_id   uuid,
  p_file_size bigint,
  p_file_key  text
)
RETURNS public.case_files
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_file   public.case_files;
  v_org_id uuid;
BEGIN
  IF p_file_size <= 0 THEN
    RAISE EXCEPTION 'Invalid file size: must be positive';
  END IF;

  IF p_file_key IS NULL OR length(trim(p_file_key)) = 0 THEN
    RAISE EXCEPTION 'Invalid file key: cannot be empty';
  END IF;

  SELECT c.org_id INTO v_org_id
  FROM   public.case_files cf
  JOIN   public.cases c ON c.id = cf.case_id
  WHERE  cf.id = p_file_id
    AND  c.org_id = public.app_get_org_id()
    AND  (
           public.app_is_admin()
           OR EXISTS (
             SELECT 1 FROM public.clients cl
             WHERE cl.id = c.client_id
               AND cl.assigned_lawyer_id = (SELECT auth.uid())
           )
         )
    AND  public.app_is_active();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;

  UPDATE public.case_files
  SET    status     = 'uploaded',
         file_size  = p_file_size,
         file_key   = p_file_key,
         updated_at = NOW()
  WHERE  id = p_file_id
  RETURNING * INTO v_file;

  RETURN v_file;
END;
$$;

-- ── RPC: confirmar upload desde portal del cliente ────────────
CREATE OR REPLACE FUNCTION public.confirm_file_upload_portal(
  p_token     text,
  p_file_id   uuid,
  p_file_key  text,
  p_file_size bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case_id uuid;
  v_exists  boolean;
BEGIN
  IF p_file_size <= 0 THEN
    RAISE EXCEPTION 'Invalid file size';
  END IF;

  SELECT id INTO v_case_id
  FROM   public.cases
  WHERE  token = p_token;

  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'Invalid case token';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.case_files
    WHERE id = p_file_id AND case_id = v_case_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'File does not belong to this case';
  END IF;

  UPDATE public.case_files
  SET    status     = 'uploaded',
         file_key   = p_file_key,
         file_size  = p_file_size,
         updated_at = NOW()
  WHERE  id = p_file_id;
END;
$$;

-- ── RPC: regenerar token de un caso ───────────────────────────
CREATE OR REPLACE FUNCTION public.regenerate_case_token(p_case_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_token text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = p_case_id
      AND (
        (public.app_is_admin() AND c.org_id = public.app_get_org_id())
        OR EXISTS (
          SELECT 1 FROM public.clients cl
          WHERE cl.id = c.client_id
            AND cl.assigned_lawyer_id = auth.uid()
        )
      )
      AND public.app_is_active()
  ) THEN
    RAISE EXCEPTION 'Access Denied or Case Not Found';
  END IF;

  v_new_token := encode(gen_random_bytes(32), 'hex');

  UPDATE public.cases
  SET    token      = v_new_token,
         updated_at = now()
  WHERE  id = p_case_id;

  RETURN v_new_token;
END;
$$;

-- ── RPC: obtener invitación por token ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_invitation(p_token text)
RETURNS TABLE(
  id         uuid,
  email      text,
  role       public.user_role,
  status     public.invitation_status,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.role, i.status, i.expires_at
  FROM   public.invitations i
  WHERE  i.token = p_token;
END;
$$;

-- ── RPC: obtener invitación con datos de org (onboarding) ─────
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE(
  email    text,
  org_name text,
  role     public.user_role,
  status   public.invitation_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT i.email, o.name AS org_name, i.role, i.status
  FROM   public.invitations i
  JOIN   public.organizations o ON o.id = i.org_id
  WHERE  i.token = p_token
    AND  i.status = 'pending'
    AND  i.expires_at > NOW();
END;
$$;

-- ── RPC: listar miembros con email ────────────────────────────
CREATE OR REPLACE FUNCTION public.get_org_members_with_email(p_org_id uuid)
RETURNS TABLE(
  id         uuid,
  full_name  text,
  avatar_url text,
  role       text,
  status     text,
  email      text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role::text,
    p.status::text,
    u.email,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.org_id = p_org_id
  ORDER BY p.full_name;
$$;

-- ── RPC: eliminar organización (solo owner) ───────────────────
CREATE OR REPLACE FUNCTION public.delete_organization(p_org_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.app_is_owner() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only the organisation owner can delete it';
  END IF;

  IF p_org_id <> public.app_get_org_id() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: You do not belong to this organisation';
  END IF;

  IF NOT public.app_is_active() THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Account is not active';
  END IF;

  RETURN QUERY
    SELECT id FROM public.profiles WHERE org_id = p_org_id;

  DELETE FROM public.audit_logs WHERE org_id = p_org_id;
  DELETE FROM public.templates  WHERE org_id = p_org_id;
  DELETE FROM public.case_files WHERE org_id = p_org_id;
  DELETE FROM public.documents  WHERE org_id = p_org_id;
  DELETE FROM public.organizations WHERE id = p_org_id;
END;
$$;

-- ── RPC: remover miembro de la organización ───────────────────
CREATE OR REPLACE FUNCTION public.remove_org_member(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requester_org uuid;
  v_target_org    uuid;
  v_target_role   user_role;
  v_admin_count   int;
BEGIN
  v_requester_org := public.app_get_org_id();

  IF NOT public.app_is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can remove members.';
  END IF;

  IF NOT public.app_is_active() THEN
    RAISE EXCEPTION 'Access Denied: User is suspended.';
  END IF;

  SELECT org_id, role INTO v_target_org, v_target_role
  FROM   public.profiles
  WHERE  id = target_user_id;

  IF v_target_org IS NULL OR v_target_org <> v_requester_org THEN
    RAISE EXCEPTION 'Target user not found in your organization.';
  END IF;

  IF v_target_role IN ('admin', 'owner') THEN
    SELECT count(*) INTO v_admin_count
    FROM   public.profiles
    WHERE  org_id = v_requester_org AND role IN ('admin', 'owner') AND status = 'active';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Constraint Violation: Cannot remove the last Admin of the organization.';
    END IF;
  END IF;

  UPDATE public.profiles
  SET    status = 'suspended', updated_at = NOW()
  WHERE  id = target_user_id;
END;
$$;

-- ── RPC: expirar organizaciones en trial vencido ──────────────
-- Llamada por cron job (pg_cron o Edge Function scheduled)
CREATE OR REPLACE FUNCTION public.expire_trialing_organizations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.organizations
  SET    plan_status = 'expired'
  WHERE  plan_status = 'trialing'
    AND  trial_ends_at IS NOT NULL
    AND  trial_ends_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── RPC: enviar respuestas del cuestionario ───────────────────
CREATE OR REPLACE FUNCTION public.submit_questionnaire_answers(p_token text, p_answers jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_case_id uuid;
BEGIN
  SELECT id INTO v_case_id
  FROM   public.cases
  WHERE  token = p_token;

  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'Case not found or invalid token';
  END IF;

  UPDATE public.cases
  SET    questionnaire_answers = p_answers,
         updated_at             = NOW()
  WHERE  id = v_case_id;
END;
$$;

-- ── RPC: guardar versión de documento (Studio) ─────────────────
CREATE OR REPLACE FUNCTION public.save_document_version(
  p_document_id uuid,
  p_content     jsonb,
  p_label       text DEFAULT NULL
)
RETURNS public.document_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_version integer;
  v_version      public.document_versions;
  v_org_id       uuid;
BEGIN
  -- Verificar que el usuario tiene acceso al documento
  SELECT d.org_id INTO v_org_id
  FROM   public.documents d
  WHERE  d.id = p_document_id
    AND  d.org_id = public.app_get_org_id()
    AND  public.app_is_active();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  -- Calcular el siguiente número de versión
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM   public.document_versions
  WHERE  document_id = p_document_id;

  INSERT INTO public.document_versions (document_id, content, version, label, saved_by)
  VALUES (p_document_id, p_content, v_next_version, p_label, auth.uid())
  RETURNING * INTO v_version;

  RETURN v_version;
END;
$$;
