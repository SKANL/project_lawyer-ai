-- ============================================================
-- 06-rls.sql — Abogado-Sala V2
-- Row Level Security del proyecto
-- Ejecutar DESPUÉS de 04-functions.sql
-- ============================================================
-- Arquitectura: app_get_org_id() + app_is_admin() + app_is_active()
-- Roles: admin/owner (gestión), member (asignado), client (portal)
-- Best practice: envolver auth.uid() en (SELECT auth.uid()) para cache
-- ============================================================

-- ── Habilitar RLS en todas las tablas públicas ────────────────
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_configs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_updates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_delete_queue ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- organizations
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id = app_get_org_id());

CREATE POLICY "Authenticated users insert organizations"
  ON public.organizations FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (id = app_get_org_id() AND app_is_admin());

-- ══════════════════════════════════════════════════════════════
-- plan_configs (solo lectura para usuarios autenticados activos)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Authenticated read plan configs"
  ON public.plan_configs FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated' AND app_is_active());

-- ══════════════════════════════════════════════════════════════
-- profiles
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (org_id = app_get_org_id());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Update profiles"
  ON public.profiles FOR UPDATE
  USING (
    app_is_active() AND (
      id = (SELECT auth.uid()) OR
      (app_is_admin() AND org_id = app_get_org_id())
    )
  );

-- ══════════════════════════════════════════════════════════════
-- org_settings
-- ══════════════════════════════════════════════════════════════
-- Todos los miembros pueden leer la configuración de su org
CREATE POLICY "Members read org settings"
  ON public.org_settings FOR SELECT
  USING (org_id = app_get_org_id() AND app_is_active());

-- Solo admins pueden modificar la configuración
CREATE POLICY "Admins manage org settings"
  ON public.org_settings FOR ALL
  USING (org_id = app_get_org_id() AND app_is_admin() AND app_is_active());

-- ══════════════════════════════════════════════════════════════
-- subscriptions (solo lectura para admins)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Admins view subscriptions"
  ON public.subscriptions FOR SELECT
  USING (org_id = app_get_org_id() AND app_is_admin() AND app_is_active());

-- ══════════════════════════════════════════════════════════════
-- invitations
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Admins view and manage invitations"
  ON public.invitations FOR ALL
  USING (org_id = app_get_org_id() AND app_is_admin() AND app_is_active());

-- ══════════════════════════════════════════════════════════════
-- clients
-- ══════════════════════════════════════════════════════════════
-- Admins ven todos; members ven los asignados a ellos
-- org.members_can_see_all_clients anula esta restricción para members
CREATE POLICY "Select Clients"
  ON public.clients FOR SELECT
  USING (
    app_is_active() AND (
      (app_is_admin() AND org_id = app_get_org_id()) OR
      assigned_lawyer_id = (SELECT auth.uid()) OR
      (
        org_id = app_get_org_id() AND
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = app_get_org_id() AND o.members_can_see_all_clients = true
        )
      )
    )
  );

CREATE POLICY "Members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (org_id = app_get_org_id() AND app_is_active());

CREATE POLICY "Update Clients"
  ON public.clients FOR UPDATE
  USING (
    app_is_active() AND (
      (app_is_admin() AND org_id = app_get_org_id()) OR
      assigned_lawyer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Delete Clients"
  ON public.clients FOR DELETE
  USING (app_is_admin() AND org_id = app_get_org_id() AND app_is_active());

-- Clientes del portal ven solo su propio perfil
CREATE POLICY "client_select_own"
  ON public.clients FOR SELECT
  USING (app_is_client() AND auth_user_id = (SELECT auth.uid()));

-- ══════════════════════════════════════════════════════════════
-- templates
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Select Templates"
  ON public.templates FOR SELECT
  USING (
    app_is_active() AND (
      (scope = 'global' AND org_id = app_get_org_id()) OR
      owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Insert Templates"
  ON public.templates FOR INSERT
  WITH CHECK (
    owner_id  = (SELECT auth.uid()) AND
    org_id    = app_get_org_id() AND
    app_is_active()
  );

CREATE POLICY "Update Templates"
  ON public.templates FOR UPDATE
  USING (owner_id = (SELECT auth.uid()) AND app_is_active());

CREATE POLICY "Delete Templates"
  ON public.templates FOR DELETE
  USING (owner_id = (SELECT auth.uid()) AND app_is_active());

-- ══════════════════════════════════════════════════════════════
-- cases
-- Admins ven todos; members ven sus casos asignados/creados
-- org.members_can_see_all_cases anula para members
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Select Cases"
  ON public.cases FOR SELECT
  USING (
    app_is_active() AND (
      (app_is_admin() AND org_id = app_get_org_id()) OR
      assigned_to = (SELECT auth.uid()) OR
      created_by  = (SELECT auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = cases.client_id
          AND clients.assigned_lawyer_id = (SELECT auth.uid())
      ) OR
      (
        org_id = app_get_org_id() AND
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = app_get_org_id() AND o.members_can_see_all_cases = true
        )
      )
    )
  );

CREATE POLICY "Insert Cases"
  ON public.cases FOR INSERT
  WITH CHECK (org_id = app_get_org_id() AND app_is_active());

CREATE POLICY "Update Cases"
  ON public.cases FOR UPDATE
  USING (
    app_is_active() AND
    org_id = app_get_org_id() AND (
      app_is_admin() OR
      assigned_to = (SELECT auth.uid()) OR
      created_by  = (SELECT auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.clients
        WHERE clients.id = cases.client_id
          AND clients.assigned_lawyer_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Delete Cases"
  ON public.cases FOR DELETE
  USING (app_is_admin() AND org_id = app_get_org_id() AND app_is_active());

-- Clientes del portal ven solo sus propios casos
CREATE POLICY "client_select_own_cases"
  ON public.cases FOR SELECT
  USING (app_is_client() AND client_id = app_get_client_id());

-- ══════════════════════════════════════════════════════════════
-- case_files
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Access Case Files"
  ON public.case_files FOR SELECT
  USING (
    app_is_active() AND (
      (app_is_admin() AND org_id = app_get_org_id()) OR
      EXISTS (
        SELECT 1 FROM public.cases
        WHERE cases.id = case_files.case_id
          AND (
            (app_is_admin() AND cases.org_id = app_get_org_id()) OR
            cases.assigned_to = (SELECT auth.uid()) OR
            cases.created_by  = (SELECT auth.uid()) OR
            EXISTS (
              SELECT 1 FROM public.clients
              WHERE clients.id = cases.client_id
                AND clients.assigned_lawyer_id = (SELECT auth.uid())
            )
          )
      )
    )
  );

CREATE POLICY "Insert Case Files"
  ON public.case_files FOR INSERT
  WITH CHECK (
    org_id = app_get_org_id() AND
    app_is_active() AND
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_files.case_id AND cases.org_id = app_get_org_id()
    )
  );

CREATE POLICY "Update Case Files"
  ON public.case_files FOR UPDATE
  USING (
    app_is_active() AND
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_files.case_id
        AND (
          (app_is_admin() AND cases.org_id = app_get_org_id()) OR
          cases.assigned_to = (SELECT auth.uid()) OR
          EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = cases.client_id
              AND clients.assigned_lawyer_id = (SELECT auth.uid())
          )
        )
    )
  );

CREATE POLICY "Delete Case Files"
  ON public.case_files FOR DELETE
  USING (
    app_is_active() AND
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_files.case_id
        AND (
          (app_is_admin() AND cases.org_id = app_get_org_id()) OR
          cases.assigned_to = (SELECT auth.uid()) OR
          EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = cases.client_id
              AND clients.assigned_lawyer_id = (SELECT auth.uid())
          )
        )
    )
  );

-- Clientes del portal ven y editan sus archivos
CREATE POLICY "client_select_own_case_files"
  ON public.case_files FOR SELECT
  USING (
    app_is_client() AND
    case_id IN (SELECT cases.id FROM public.cases WHERE cases.client_id = app_get_client_id())
  );

CREATE POLICY "client_update_own_case_files"
  ON public.case_files FOR UPDATE
  USING (
    app_is_client() AND
    case_id IN (SELECT cases.id FROM public.cases WHERE cases.client_id = app_get_client_id())
  );

-- ══════════════════════════════════════════════════════════════
-- case_notes
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "case_notes_select"
  ON public.case_notes FOR SELECT TO authenticated
  USING (org_id = app_get_org_id());

CREATE POLICY "case_notes_insert"
  ON public.case_notes FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid()) AND
    org_id    = app_get_org_id()
  );

CREATE POLICY "case_notes_update"
  ON public.case_notes FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "case_notes_delete"
  ON public.case_notes FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = author_id OR
    (org_id = app_get_org_id() AND app_is_admin())
  );

-- ══════════════════════════════════════════════════════════════
-- case_updates
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "case_updates_select"
  ON public.case_updates FOR SELECT
  USING (org_id = app_get_org_id() AND app_is_active());

CREATE POLICY "case_updates_insert"
  ON public.case_updates FOR INSERT
  WITH CHECK (org_id = app_get_org_id() AND app_is_active());

CREATE POLICY "case_updates_delete"
  ON public.case_updates FOR DELETE
  USING (org_id = app_get_org_id() AND app_is_admin() AND app_is_active());

-- Clientes del portal ven actualizaciones de sus casos
CREATE POLICY "client_select_own_case_updates"
  ON public.case_updates FOR SELECT
  USING (
    app_is_client() AND
    case_id IN (SELECT cases.id FROM public.cases WHERE cases.client_id = app_get_client_id())
  );

-- ══════════════════════════════════════════════════════════════
-- tasks
-- ══════════════════════════════════════════════════════════════
-- V2: usa JWT claims directamente (mejor performance que llamar funciones)
-- Admins ven todas las tareas de su org; members ven las asignadas/creadas
CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (
    org_id = app_get_org_id() AND
    app_is_active() AND (
      app_is_admin() OR
      assigned_to = (SELECT auth.uid()) OR
      created_by  = (SELECT auth.uid())
    )
  );

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (
    org_id     = app_get_org_id() AND
    created_by = (SELECT auth.uid()) AND
    app_is_active()
  );

CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  USING (
    org_id = app_get_org_id() AND
    app_is_active() AND (
      assigned_to = (SELECT auth.uid()) OR
      created_by  = (SELECT auth.uid()) OR
      app_is_admin()
    )
  );

CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  USING (org_id = app_get_org_id() AND app_is_admin() AND app_is_active());

-- ══════════════════════════════════════════════════════════════
-- documents (Studio)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "documents_select"
  ON public.documents FOR SELECT
  USING (
    org_id = app_get_org_id() AND
    app_is_active() AND (
      app_is_admin() OR
      author_id = (SELECT auth.uid()) OR
      -- Si está vinculado a un caso, el asignado al caso también lo ve
      EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = documents.case_id
          AND (
            c.assigned_to = (SELECT auth.uid()) OR
            c.created_by  = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY "documents_insert"
  ON public.documents FOR INSERT
  WITH CHECK (
    org_id    = app_get_org_id() AND
    author_id = (SELECT auth.uid()) AND
    app_is_active()
  );

CREATE POLICY "documents_update"
  ON public.documents FOR UPDATE
  USING (
    org_id = app_get_org_id() AND
    app_is_active() AND (
      author_id = (SELECT auth.uid()) OR app_is_admin()
    )
  );

CREATE POLICY "documents_delete"
  ON public.documents FOR DELETE
  USING (
    org_id = app_get_org_id() AND
    app_is_active() AND (
      author_id = (SELECT auth.uid()) OR app_is_admin()
    )
  );

-- ══════════════════════════════════════════════════════════════
-- document_versions (Studio — historial)
-- ══════════════════════════════════════════════════════════════
-- El acceso a versiones sigue el acceso al documento padre
CREATE POLICY "document_versions_select"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
        AND d.org_id = app_get_org_id()
        AND app_is_active()
    )
  );

-- Las versiones las crea solo la RPC save_document_version (SECURITY DEFINER)
-- Esta política permite que service_role y la RPC inserten
CREATE POLICY "document_versions_insert"
  ON public.document_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
        AND d.org_id = app_get_org_id()
        AND (d.author_id = (SELECT auth.uid()) OR app_is_admin())
    )
  );

-- ══════════════════════════════════════════════════════════════
-- audit_logs
-- INSERT y SELECT usan {public} (sin TO) para permitir triggers SECURITY DEFINER
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "View audit logs"
  ON public.audit_logs FOR SELECT
  USING (org_id = app_get_org_id() AND app_is_admin() AND app_is_active());

CREATE POLICY "Triggers can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (org_id = app_get_org_id());

-- ══════════════════════════════════════════════════════════════
-- notifications
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()) AND app_is_active());

CREATE POLICY "Users update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (user_id = (SELECT auth.uid()) AND app_is_active());

-- service_role puede insertar notificaciones (enviadas por Edge Functions)
CREATE POLICY "Service or admin can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (org_id = app_get_org_id());

-- ══════════════════════════════════════════════════════════════
-- jobs
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "Users can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    org_id       = app_get_org_id() AND
    requester_id = (SELECT auth.uid()) AND
    app_is_active()
  );

CREATE POLICY "Users view their own jobs"
  ON public.jobs FOR SELECT
  USING (
    org_id = app_get_org_id() AND
    (requester_id = (SELECT auth.uid()) OR app_is_admin()) AND
    app_is_active()
  );

-- ══════════════════════════════════════════════════════════════
-- storage_delete_queue — solo service_role (interno)
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "internal_only_storage_queue"
  ON public.storage_delete_queue FOR ALL
  USING (false);
