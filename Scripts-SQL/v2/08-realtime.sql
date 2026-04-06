-- ============================================================
-- 08-realtime.sql — Abogado-Sala V2
-- Habilitación de Realtime para tablas del proyecto
-- Ejecutar DESPUÉS de 02-tables.sql
-- ============================================================

-- Notificaciones (badge en tiempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Casos (actualizaciones de estado en lista)
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;

-- Archivos de caso (estado en tiempo real en el portal)
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_files;

-- Audit logs (monitoreo en tiempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- V2: documentos (autoguardado — el cliente sabe si fue guardado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
