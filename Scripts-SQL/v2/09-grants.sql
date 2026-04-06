-- ============================================================
-- 09-grants.sql — Abogado-Sala V2
-- Permisos para RPCs y funciones públicas
-- Ejecutar DESPUÉS de 04-functions.sql
-- ============================================================

-- ── Permisos para usuario anon (portal público) ───────────────
-- El portal de documentos usa token de caso, no login de Supabase
GRANT EXECUTE ON FUNCTION public.get_case_by_token(text)                        TO anon;
GRANT EXECUTE ON FUNCTION public.get_case_updates_by_token(text)                TO anon;
GRANT EXECUTE ON FUNCTION public.get_case_validation(text)                      TO anon;
GRANT EXECUTE ON FUNCTION public.update_case_progress(text, integer)            TO anon;
GRANT EXECUTE ON FUNCTION public.flag_file_exception(text, uuid, text)          TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_file_upload_portal(text, uuid, text, bigint) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_questionnaire_answers(text, jsonb)      TO anon;

-- ── Permisos para usuario authenticated ──────────────────────
GRANT EXECUTE ON FUNCTION public.get_invitation(text)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_members_with_email(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_file_upload(uuid, bigint, text)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_case_token(uuid)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_org_member(uuid)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_document_version(uuid, jsonb, text)       TO authenticated;

-- delete_organization: solo owners (verificación interna en la función)
REVOKE ALL ON FUNCTION public.delete_organization(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_organization(uuid)                      TO authenticated;

-- ── Permisos para service_role (webhooks, crons, edge functions) ──
GRANT EXECUTE ON FUNCTION public.expire_trialing_organizations()                TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_files_for_case(uuid, uuid, jsonb)    TO service_role;
