-- ============================================================
-- 07-storage.sql — Abogado-Sala V2
-- Storage buckets y políticas
-- Ejecutar DESPUÉS de 06-rls.sql
-- ============================================================

-- ── Bucket: case-files ────────────────────────────────────────
-- Almacena todos los documentos legales del portal cliente-abogado
-- Privado: acceso controlado vía signed URLs generadas por el backend
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-files',
  'case-files',
  false,       -- privado
  52428800,    -- 50 MB por archivo
  NULL         -- sin restricción de MIME type
)
ON CONFLICT (id) DO NOTHING;

-- ── Bucket: organization-assets ───────────────────────────────
-- Logos e imágenes de marca de las organizaciones
-- Público: los logos son accesibles sin autenticación
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,        -- público
  5242880,     -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── Bucket: avatars ───────────────────────────────────────────
-- V2: avatares de perfil de usuarios
-- Público: los avatares son accesibles sin autenticación
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,        -- público
  5242880,     -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── Bucket: zip-exports ───────────────────────────────────────
-- Exportaciones ZIP generadas por jobs — acceso solo por service_role
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'zip-exports',
  'zip-exports',
  false,       -- privado
  1073741824,  -- 1 GB
  ARRAY['application/zip']
)
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- Políticas de Storage: case-files
-- ══════════════════════════════════════════════════════════════

-- Staff (usuarios autenticados de la plataforma) tiene acceso completo
CREATE POLICY "Staff full access on case files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'case-files')
  WITH CHECK (bucket_id = 'case-files');

-- Portal anónimo (clientes sin login) puede ver archivos
-- El control real es mediante signed URLs generadas por el backend
-- La path tiene formato: {org_id}/{case_id}/{file_name}
CREATE POLICY "Portal anon can read case files"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'case-files');

-- Portal anónimo puede subir archivos (validación en RPC confirm_file_upload_portal)
CREATE POLICY "Portal anon can upload case files"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'case-files');

-- Portal anónimo puede re-subir archivos rechazados
CREATE POLICY "Portal anon can update case files"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'case-files');


-- ══════════════════════════════════════════════════════════════
-- Políticas de Storage: organization-assets
-- ══════════════════════════════════════════════════════════════

-- Lectura pública (logos de orgs visibles para todos)
CREATE POLICY "Public read org assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-assets');

-- Solo admins pueden gestionar assets de la organización
CREATE POLICY "Admins manage org assets"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'organization-assets' AND (SELECT auth.role()) = 'authenticated')
  WITH CHECK (bucket_id = 'organization-assets' AND (SELECT auth.role()) = 'authenticated');


-- ══════════════════════════════════════════════════════════════
-- Políticas de Storage: avatars
-- ══════════════════════════════════════════════════════════════

-- Lectura pública (avatares visibles para todos)
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Cada usuario solo puede gestionar su propia carpeta de avatares
-- Path format: {user_id}/avatar.png
CREATE POLICY "Users manage own avatar"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );


-- ══════════════════════════════════════════════════════════════
-- Políticas de Storage: zip-exports
-- ══════════════════════════════════════════════════════════════

-- Solo service_role puede acceder a los ZIP exports (Edge Functions)
CREATE POLICY "Service role full access zip exports"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'zip-exports')
  WITH CHECK (bucket_id = 'zip-exports');
