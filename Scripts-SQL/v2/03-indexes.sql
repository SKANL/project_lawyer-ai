-- ============================================================
-- 03-indexes.sql — Abogado-Sala V2
-- Índices de rendimiento del proyecto
-- Ejecutar DESPUÉS de 02-tables.sql
-- ============================================================
-- Best practice (skill): índices en FK columns, columnas usadas en RLS,
-- y columnas de búsqueda frecuente. Partial indexes donde aplica.
-- ============================================================

-- ── audit_logs ────────────────────────────────────────────────
CREATE INDEX idx_audit_logs_org_created  ON public.audit_logs USING btree (org_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor        ON public.audit_logs USING btree (actor_id);
CREATE INDEX idx_audit_logs_actor_action ON public.audit_logs USING btree (actor_id, action);

-- ── case_files ────────────────────────────────────────────────
CREATE INDEX idx_case_files_case_id ON public.case_files USING btree (case_id);
CREATE INDEX idx_case_files_org_id  ON public.case_files USING btree (org_id);
-- Partial index: solo archivos pendientes (los más consultados)
CREATE INDEX idx_case_files_pending ON public.case_files USING btree (case_id) WHERE status = 'pending';

-- ── case_notes ────────────────────────────────────────────────
CREATE INDEX idx_case_notes_case_id  ON public.case_notes USING btree (case_id, created_at DESC);
CREATE INDEX idx_case_notes_org_id   ON public.case_notes USING btree (org_id);
CREATE INDEX idx_case_notes_author   ON public.case_notes USING btree (author_id);

-- ── cases ─────────────────────────────────────────────────────
CREATE INDEX idx_cases_org_id       ON public.cases USING btree (org_id);
CREATE INDEX idx_cases_client_id    ON public.cases USING btree (client_id);
CREATE INDEX idx_cases_status       ON public.cases USING btree (status);
-- token: lookup muy frecuente (portal cliente) — btree suficiente por UNIQUE constraint
CREATE INDEX idx_cases_assigned_to  ON public.cases USING btree (assigned_to);
CREATE INDEX idx_cases_created_by   ON public.cases USING btree (created_by);
-- Partial index: template_id solo cuando no es null
CREATE INDEX idx_cases_template_id  ON public.cases USING btree (template_id) WHERE template_id IS NOT NULL;
-- V2: búsqueda por número de expediente
CREATE INDEX idx_cases_case_number  ON public.cases USING btree (org_id, case_number) WHERE case_number IS NOT NULL;

-- ── clients ───────────────────────────────────────────────────
CREATE INDEX idx_clients_org_id          ON public.clients USING btree (org_id);
CREATE INDEX idx_clients_assigned_lawyer ON public.clients USING btree (assigned_lawyer_id);
-- Búsqueda combinada org+email (UNIQUE constraint ya lo optimiza, índice extra redundante)
-- Búsqueda de texto: pg_trgm para full-name search
CREATE INDEX idx_clients_full_name_trgm  ON public.clients USING gin (full_name gin_trgm_ops);
-- Partial index: solo clientes activos (prospects/archived son menos consultados)
CREATE INDEX idx_clients_active          ON public.clients USING btree (org_id) WHERE status = 'active';

-- ── documents ─────────────────────────────────────────────────
CREATE INDEX idx_documents_org_id    ON public.documents USING btree (org_id);
CREATE INDEX idx_documents_author_id ON public.documents USING btree (author_id);
-- Partial index: documentos vinculados a un caso
CREATE INDEX idx_documents_case_id   ON public.documents USING btree (case_id) WHERE case_id IS NOT NULL;
-- Búsqueda por título (trgm)
CREATE INDEX idx_documents_title_trgm ON public.documents USING gin (title gin_trgm_ops);

-- ── document_versions ─────────────────────────────────────────
CREATE INDEX idx_doc_versions_document ON public.document_versions USING btree (document_id, version DESC);

-- ── invitations ───────────────────────────────────────────────
CREATE INDEX idx_invitations_org_id     ON public.invitations USING btree (org_id);
CREATE INDEX idx_invitations_email      ON public.invitations USING btree (email);
CREATE INDEX idx_invitations_token      ON public.invitations USING btree (token);
CREATE INDEX idx_invitations_invited_by ON public.invitations USING btree (invited_by);
-- Partial: solo invitaciones pendientes (las más consultadas)
CREATE INDEX idx_invitations_pending    ON public.invitations USING btree (email, org_id) WHERE status = 'pending';

-- ── jobs ──────────────────────────────────────────────────────
CREATE INDEX idx_jobs_org_id       ON public.jobs USING btree (org_id);
CREATE INDEX idx_jobs_requester_id ON public.jobs USING btree (requester_id);
-- Partial: jobs pendientes o en proceso (los activos)
CREATE INDEX idx_jobs_active       ON public.jobs USING btree (org_id) WHERE status IN ('pending', 'processing');

-- ── notifications ─────────────────────────────────────────────
CREATE INDEX idx_notifications_org_id  ON public.notifications USING btree (org_id);
-- Partial: solo no leídas (para el badge counter)
CREATE INDEX idx_notifications_unread  ON public.notifications USING btree (user_id) WHERE read = false;

-- ── organizations ─────────────────────────────────────────────
-- Partial: orgs en trial activo (para cron de expiración)
CREATE INDEX idx_organizations_trialing ON public.organizations USING btree (trial_ends_at)
  WHERE plan_status = 'trialing';
-- Partial: orgs que no completaron onboarding (para funnel analytics)
CREATE INDEX idx_organizations_onboarding ON public.organizations USING btree (created_at)
  WHERE onboarding_completed = false;

-- ── profiles ──────────────────────────────────────────────────
CREATE INDEX idx_profiles_org_id ON public.profiles USING btree (org_id);
CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);

-- ── storage_delete_queue ──────────────────────────────────────
CREATE INDEX idx_storage_delete_queue_pending ON public.storage_delete_queue USING btree (created_at)
  WHERE status = 'pending';

-- ── subscriptions ─────────────────────────────────────────────
CREATE INDEX idx_subscriptions_org_id  ON public.subscriptions USING btree (org_id);
CREATE INDEX idx_subscriptions_stripe  ON public.subscriptions USING btree (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── tasks ─────────────────────────────────────────────────────
CREATE INDEX idx_tasks_org_id      ON public.tasks USING btree (org_id);
-- V2: partial index para tareas vinculadas a un caso
CREATE INDEX idx_tasks_case_id     ON public.tasks USING btree (case_id, created_at DESC) WHERE case_id IS NOT NULL;
-- V2: partial index para tareas generales (sin caso)
CREATE INDEX idx_tasks_no_case     ON public.tasks USING btree (org_id, created_at DESC) WHERE case_id IS NULL;
CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to) WHERE assigned_to IS NOT NULL;
-- Búsqueda por estado+org (dashboard de tareas)
CREATE INDEX idx_tasks_org_status  ON public.tasks USING btree (org_id, status);
-- Partial: tareas pendientes o en progreso (las activas)
CREATE INDEX idx_tasks_active      ON public.tasks USING btree (org_id, due_date)
  WHERE status IN ('pending', 'in_progress');

-- ── templates ─────────────────────────────────────────────────
CREATE INDEX idx_templates_org_id   ON public.templates USING btree (org_id);
CREATE INDEX idx_templates_owner_id ON public.templates USING btree (owner_id);

-- ── case_updates ──────────────────────────────────────────────
CREATE INDEX idx_case_updates_case_id ON public.case_updates USING btree (case_id, created_at DESC);
