-- ============================================================
-- 05-triggers.sql — Abogado-Sala V2
-- Triggers del proyecto
-- Ejecutar DESPUÉS de 04-functions.sql
-- ============================================================

-- ── auth — crear perfil al registrarse ────────────────────────
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── organizations ─────────────────────────────────────────────
-- Auditoría de cambios en la organización
CREATE OR REPLACE TRIGGER tr_audit_organizations
  AFTER UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- V2: updated_at automático para organizaciones
CREATE OR REPLACE TRIGGER tr_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── org_settings ──────────────────────────────────────────────
-- V2: updated_at automático para settings
CREATE OR REPLACE TRIGGER tr_org_settings_updated_at
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- V2: inicializar org_settings al crear una organización
CREATE OR REPLACE TRIGGER tr_initialize_org_settings
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_org_settings();

-- ── profiles ──────────────────────────────────────────────────
-- Sincronizar claims en auth.users cuando cambia rol/org
CREATE OR REPLACE TRIGGER tr_sync_claims
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_claims_to_auth();

-- Auditoría de cambios en perfiles
CREATE OR REPLACE TRIGGER tr_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- Prevenir eliminación del último admin
CREATE OR REPLACE TRIGGER on_profile_delete_check
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_delete();

-- V2: updated_at para profiles
CREATE OR REPLACE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── subscriptions ─────────────────────────────────────────────
-- Sincronizar estado de suscripción con el plan de la organización
CREATE OR REPLACE TRIGGER tr_sync_subscription_org
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_status();

-- updated_at para subscriptions
CREATE OR REPLACE TRIGGER tr_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── invitations ───────────────────────────────────────────────
-- Verificar suscripción activa antes de crear invitación
CREATE OR REPLACE TRIGGER check_billing_invitations
  BEFORE INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_active_subscription();

-- Auditoría de invitaciones
CREATE OR REPLACE TRIGGER tr_audit_invitations
  AFTER INSERT OR UPDATE OR DELETE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- ── clients ───────────────────────────────────────────────────
-- Verificar cuotas de clientes del plan
CREATE OR REPLACE TRIGGER check_clients_quota
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.check_org_quotas();

-- Verificar que el abogado asignado pertenece a la misma org
CREATE OR REPLACE TRIGGER tr_check_lawyer_org
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.check_lawyer_org_match();

-- Auditoría de clientes
CREATE OR REPLACE TRIGGER tr_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- updated_at para clients
CREATE OR REPLACE TRIGGER tr_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── cases ─────────────────────────────────────────────────────
-- Verificar suscripción activa antes de crear caso
CREATE OR REPLACE TRIGGER check_billing_cases
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_active_subscription();

-- Generar archivos requeridos del template al crear caso
CREATE OR REPLACE TRIGGER tr_generate_files
  AFTER INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_files_from_snapshot();

-- Auditoría de casos
CREATE OR REPLACE TRIGGER tr_audit_cases
  AFTER INSERT OR UPDATE OR DELETE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- updated_at para cases
CREATE OR REPLACE TRIGGER tr_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── case_files ────────────────────────────────────────────────
-- Actualizar uso de storage al subir/eliminar archivos
CREATE OR REPLACE TRIGGER tr_track_storage_usage
  AFTER INSERT OR UPDATE OR DELETE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_storage_usage();

-- Encolar eliminación física en storage al eliminar registro
CREATE OR REPLACE TRIGGER on_case_file_deleted
  AFTER DELETE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_storage_deletion();

-- Auditoría de archivos
CREATE OR REPLACE TRIGGER tr_audit_case_files
  AFTER INSERT OR UPDATE OR DELETE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- updated_at para case_files
CREATE OR REPLACE TRIGGER tr_case_files_updated_at
  BEFORE UPDATE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── case_notes ────────────────────────────────────────────────
-- updated_at automático para notas
CREATE OR REPLACE TRIGGER tr_case_notes_updated_at
  BEFORE UPDATE ON public.case_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── tasks ─────────────────────────────────────────────────────
-- updated_at automático para tareas
CREATE OR REPLACE TRIGGER tr_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── documents ─────────────────────────────────────────────────
-- V2: updated_at para documentos del Studio
CREATE OR REPLACE TRIGGER tr_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── jobs ──────────────────────────────────────────────────────
-- Disparar webhook cuando se crea un job de tipo zip_export
CREATE OR REPLACE TRIGGER on_zip_job_created
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  WHEN (NEW.type = 'zip_export')
  EXECUTE FUNCTION public.trigger_process_zip_job();

-- updated_at para jobs
CREATE OR REPLACE TRIGGER tr_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
