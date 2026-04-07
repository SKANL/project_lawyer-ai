-- Migración: Simplificación de Estatus de Expedientes (V2.3)
-- Objetivo: Consolidar 8 estatus en 5 categorías globales profesionales.

-- 1. Actualizar registros existentes a las nuevas categorías lógicas
-- Mapeo:
-- 'pending_docs' -> 'draft'
-- 'in_progress' -> 'active'
-- 'review' -> 'review' (sin cambios)
-- 'suspended', 'cancelled' -> 'suspended'
-- 'completed', 'archived' -> 'closed'

BEGIN;

-- Actualización masiva de datos en la tabla public.cases
UPDATE public.cases SET status = 'draft' WHERE status = 'pending_docs';
UPDATE public.cases SET status = 'active' WHERE status = 'in_progress';
UPDATE public.cases SET status = 'suspended' WHERE status = 'cancelled';
UPDATE public.cases SET status = 'closed' WHERE status IN ('completed', 'archived');

-- 2. Limpieza del Enum (Postgres 15+ en Supabase permite manejar enums de forma segura)
-- Nota: Para simplificar, agregamos 'active' y 'closed' si no existen primero.
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'closed';

COMMIT;

-- Nota: Los valores antiguos ('in_progress', 'pending_docs', etc.) seguirán existiendo en el tipo enum 
-- pero ya no serán usados por la aplicación ni por los nuevos registros. 
-- Eliminar valores de un enum requiere reconstruir el tipo, lo cual es arriesgado en producción.
