-- ============================================================
-- 02-tables.sql — Abogado-Sala V2
-- Tablas principales del proyecto
-- Ejecutar DESPUÉS de 01-enums.sql
-- ============================================================

-- ── organizations ─────────────────────────────────────────────
CREATE TABLE public.organizations (
  id                           uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  name                         text              NOT NULL,
  slug                         text              UNIQUE NOT NULL,
  plan_tier                    public.plan_tier  NOT NULL DEFAULT 'trial',
  plan_status                  public.plan_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id           text              UNIQUE,
  trial_ends_at                timestamptz       NOT NULL DEFAULT (now() + interval '14 days'),
  storage_used                 bigint            NOT NULL DEFAULT 0 CHECK (storage_used >= 0),
  logo_url                     text,
  primary_color                text              DEFAULT '#18181b',
  -- V2: idioma preferido de la organización (afecta emails, portal cliente)
  locale                       public.app_locale NOT NULL DEFAULT 'es',
  -- V2: código de país para integraciones fiscales futuras (SAT/DIAN/SII)
  country_code                 text              NOT NULL DEFAULT 'MX' CHECK (char_length(country_code) = 2),
  -- V2: onboarding wizard completado
  onboarding_completed         boolean           NOT NULL DEFAULT false,
  -- V2: código de referido para growth/referrals
  referral_code                text              UNIQUE,
  -- V1: configuración de visibilidad de miembros
  members_can_see_all_cases    boolean           NOT NULL DEFAULT false,
  members_can_see_all_clients  boolean           NOT NULL DEFAULT false,
  created_at                   timestamptz       NOT NULL DEFAULT now(),
  updated_at                   timestamptz       NOT NULL DEFAULT now()
);

-- ── plan_configs ───────────────────────────────────────────────
-- Define los límites de cada tier de plan
CREATE TABLE public.plan_configs (
  plan                public.plan_tier  PRIMARY KEY,
  max_clients         integer           NOT NULL,
  max_members         integer           NOT NULL,  -- V2: miembros totales (no solo admins)
  max_admins          integer           NOT NULL,
  max_storage_bytes   bigint            NOT NULL,
  can_white_label     boolean           NOT NULL DEFAULT false,
  -- V2: acceso al editor Studio
  can_use_studio      boolean           NOT NULL DEFAULT true,
  -- V2: acceso al portal de cliente (incluido en todos los planes V2)
  can_use_client_portal boolean         NOT NULL DEFAULT true
);

-- Datos de configuración de planes V2
-- Psicología de precios: starter limita a 1 miembro (fuerza upgrade)
-- pro es el TARGET ($49/mes), firm es el ANCLA ($149/mes)
INSERT INTO public.plan_configs
  (plan,      max_clients, max_members, max_admins, max_storage_bytes,  can_white_label, can_use_studio, can_use_client_portal)
VALUES
  ('trial',   10,          1,           1,          524288000,           false,           true,           true),   -- 500 MB, 14 días
  ('starter', 50,          1,           1,          1073741824,          false,           true,           true),   -- 1 GB, solo 1 usuario
  ('pro',     500,         5,           3,          5368709120,          true,            true,           true),   -- 5 GB, 5 usuarios ← TARGET
  ('firm',    9999,        50,          10,         21474836480,         true,            true,           true);   -- 20 GB, 50 usuarios ← ANCLA

-- ── profiles ──────────────────────────────────────────────────
-- Extiende auth.users con datos de perfil y rol organizacional
CREATE TABLE public.profiles (
  id              uuid               PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          uuid               REFERENCES public.organizations(id) ON DELETE SET NULL,
  role            public.user_role   NOT NULL DEFAULT 'member',
  status          public.user_status NOT NULL DEFAULT 'active',
  full_name       text,
  avatar_url      text,
  assigned_phone  text,
  -- V2: override de idioma por usuario (null = usa el locale de la org)
  locale          public.app_locale,
  -- V2: timestamp del último acceso (para analytics de actividad)
  last_seen_at    timestamptz,
  created_at      timestamptz        NOT NULL DEFAULT now(),
  updated_at      timestamptz        NOT NULL DEFAULT now()
);

-- ── org_settings ──────────────────────────────────────────────
-- Configuración flexible de la organización (reemplaza campos hardcodeados en org)
-- Permite extender sin migraciones futuras via JSONB
-- Ejemplos de settings: {
--   "whatsapp_template": "Hola {client_name}...",
--   "timezone": "America/Mexico_City",
--   "clause_library": [...],  ← cláusulas personalizadas del Studio
--   "date_format": "es-MX"
-- }
CREATE TABLE public.org_settings (
  org_id     uuid  PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  settings   jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── subscriptions ─────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                      uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid                       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id  text                       UNIQUE,
  stripe_price_id         text,
  status                  public.subscription_status NOT NULL,
  -- V2: billing cycle (mensual o anual)
  billing_interval        text                       CHECK (billing_interval IN ('month', 'year')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at               timestamptz,
  canceled_at             timestamptz,
  created_at              timestamptz                NOT NULL DEFAULT now(),
  updated_at              timestamptz                NOT NULL DEFAULT now()
);

-- ── invitations ───────────────────────────────────────────────
CREATE TABLE public.invitations (
  id          uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid                      NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email       text                      NOT NULL,
  role        public.user_role          NOT NULL DEFAULT 'member',
  token       text                      UNIQUE NOT NULL,
  invited_by  uuid                      REFERENCES public.profiles(id) ON DELETE SET NULL,
  status      public.invitation_status  NOT NULL DEFAULT 'pending',
  expires_at  timestamptz               NOT NULL DEFAULT (now() + interval '7 days'),
  created_at  timestamptz               NOT NULL DEFAULT now()
);

-- ── clients ───────────────────────────────────────────────────
CREATE TABLE public.clients (
  id                  uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid                 NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_lawyer_id  uuid                 REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name           text                 NOT NULL,
  email               text,
  phone               text,
  -- V2: RFC (México), NIT (Colombia), RUT (Chile) — campo genérico de tax ID
  tax_id              text,
  -- V2: notas breves del abogado sobre el cliente
  notes               text,
  status              public.client_status NOT NULL DEFAULT 'prospect',
  -- Portal: usuario auth vinculado al cliente
  auth_user_id        uuid                 UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz          NOT NULL DEFAULT now(),
  updated_at          timestamptz          NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

-- ── templates ─────────────────────────────────────────────────
CREATE TABLE public.templates (
  id         uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid                   NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id   uuid                   REFERENCES public.profiles(id) ON DELETE SET NULL,
  title      text                   NOT NULL,
  schema     jsonb                  NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(schema) = 'object'),
  scope      public.template_scope  NOT NULL DEFAULT 'private',
  created_at timestamptz            NOT NULL DEFAULT now(),
  updated_at timestamptz            NOT NULL DEFAULT now()
);

-- ── cases ─────────────────────────────────────────────────────
CREATE TABLE public.cases (
  id                    uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid               NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  org_id                uuid               NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id           uuid               REFERENCES public.templates(id) ON DELETE SET NULL,
  template_snapshot     jsonb              NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(template_snapshot) = 'object'),
  questionnaire_answers jsonb              DEFAULT '{}',
  current_step_index    integer            NOT NULL DEFAULT 0 CHECK (current_step_index >= 0),
  token                 text               UNIQUE NOT NULL,
  status                public.case_status NOT NULL DEFAULT 'draft',
  -- V2: título descriptivo del expediente (no solo el nombre del cliente)
  title                 text,
  -- V2: número de expediente interno (para referencia humana)
  case_number           text,
  expires_at            timestamptz        NOT NULL DEFAULT (now() + interval '30 days'),
  assigned_to           uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by            uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            timestamptz        NOT NULL DEFAULT now(),
  updated_at            timestamptz        NOT NULL DEFAULT now()
);

-- ── case_files ────────────────────────────────────────────────
CREATE TABLE public.case_files (
  id               uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          uuid               NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  org_id           uuid               NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_key         text,
  file_size        bigint             NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  -- V2: categorías como keys neutros (el frontend traduce)
  -- identity_doc, contract, deed, power_of_attorney, invoice, judgment, other
  category         text               NOT NULL DEFAULT 'other' CHECK (category = ANY (ARRAY[
    'identity_doc', 'contract', 'deed', 'power_of_attorney', 'invoice', 'judgment', 'other'
  ])),
  status           public.file_status NOT NULL DEFAULT 'pending',
  exception_reason text,
  description      text,
  review_note      text,
  reviewed_by      uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz        NOT NULL DEFAULT now(),
  updated_at       timestamptz        NOT NULL DEFAULT now()
);

-- ── case_notes ────────────────────────────────────────────────
CREATE TABLE public.case_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  org_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text        NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── case_updates ──────────────────────────────────────────────
-- Actualizaciones/hitos visibles en el portal del cliente
CREATE TABLE public.case_updates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  org_id     uuid        NOT NULL,
  author_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  title      text        NOT NULL,
  body       text,
  type       text        NOT NULL DEFAULT 'info' CHECK (type = ANY (ARRAY[
    'info', 'milestone', 'warning', 'document_request'
  ])),
  created_at timestamptz DEFAULT now()
);

-- ── tasks ─────────────────────────────────────────────────────
-- V2: case_id es NULLABLE — permite tareas generales sin expediente
CREATE TABLE public.tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- V2: case_id nullable para tareas generales del despacho
  case_id      uuid        REFERENCES public.cases(id) ON DELETE CASCADE,
  title        text        NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 255),
  description  text,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending', 'in_progress', 'completed', 'cancelled'
  ])),
  priority     text        NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY[
    'low', 'medium', 'high', 'urgent'
  ])),
  assigned_to  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date     date,
  completed_at timestamptz,
  completed_by uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── documents ─────────────────────────────────────────────────
-- Documentos del Studio (editor TipTap legal)
-- case_id nullable: documentos pueden ser standalone o vinculados a un expediente
CREATE TABLE public.documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  case_id     uuid        REFERENCES public.cases(id) ON DELETE SET NULL,
  author_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'Documento sin título',
  -- Contenido en formato JSON de TipTap (ProseMirror)
  content     jsonb       NOT NULL DEFAULT '{"type":"doc","content":[]}',
  word_count  integer     NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── document_versions ─────────────────────────────────────────
-- Historial de versiones del Studio (snapshots manuales y al cerrar)
CREATE TABLE public.document_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid        NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content     jsonb       NOT NULL,
  version     integer     NOT NULL,
  -- Label opcional: "Versión 1", "Antes de firma", etc.
  label       text,
  saved_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Unicidad: un documento no puede tener dos versiones con el mismo número
  UNIQUE (document_id, version)
);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  target_id  uuid,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  message    text        NOT NULL,
  type       text        NOT NULL CHECK (type = ANY (ARRAY['info', 'warning', 'success', 'error'])),
  read       boolean     NOT NULL DEFAULT false,
  -- metadata: link de redireccion, case_id, etc.
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── jobs ──────────────────────────────────────────────────────
-- Jobs async (e.g., exportación zip de expedientes, generación de reportes)
CREATE TABLE public.jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  type          text        NOT NULL CHECK (type = ANY (ARRAY['zip_export', 'report_gen', 'docx_export'])),
  status        text        NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending', 'processing', 'completed', 'failed'
  ])),
  result_url    text,
  error_message text,
  metadata      jsonb       DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── storage_delete_queue ──────────────────────────────────────
-- Cola de eliminación física de archivos en Storage
-- Solo accesible por service_role (ver RLS)
CREATE TABLE public.storage_delete_queue (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id    text        NOT NULL,
  file_path    text        NOT NULL,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending', 'processing', 'completed', 'failed'
  ])),
  retry_count  integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
