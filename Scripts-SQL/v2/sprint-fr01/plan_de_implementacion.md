# Plan de Implementación — Correcciones FR-01 y FR-02

## Objetivo

Corregir 2 problemas críticos detectados por el SME Carlos R.: (1) la máquina de estados procesales estática que no distingue entre materias legales, y (2) la terminología incorrecta "Detenido" + falta de audit trail en cambios de estado.

> [!CAUTION]
> ### ⚠️ HAY DATOS REALES EN PRODUCCIÓN SIN BACKUP
> El proyecto tiene datos en la base de datos que **no se pueden perder** y **no existen copias de seguridad**. Toda migración debe ser:
> - **Aditiva** — Solo `ADD COLUMN`, nunca `DROP COLUMN`
> - **Con fallback** — Las columnas antiguas (`status`, `legal_area`) se mantienen funcionales
> - **Ejecutada primero en un entorno de staging** si es posible
> - **Precedida por un backup manual**: `pg_dump` antes de ejecutar cualquier SQL

---

## Mapa de Impacto — Archivos Afectados

| Archivo | Tipo de Cambio | FR |
|---------|---------------|-----|
| `Scripts-SQL/v2/` | **[NEW]** SQL: tablas, RPC, RLS, seeder | FR-01, FR-02 |
| `src/actions/cases.ts` | **[MODIFY]** Server Actions | FR-01, FR-02 |
| `src/components/components-reusables/cases/case-form.tsx` | **[MODIFY]** Select reactivo Materia→Etapa | FR-01 |
| `src/components/components-reusables/cases/kanban-board.tsx` | **[MODIFY]** Columnas dinámicas | FR-01 |
| `src/app/[locale]/(app)/cases/page.tsx` | **[MODIFY]** Fetch legal_areas + stages | FR-01 |
| `src/messages/es/cases.json` | **[MODIFY]** Fix "Pausado / Detenido" | FR-02 |
| `src/types/database.ts` | **[REGENERAR]** `npx supabase gen types` | FR-01 |

---

## Fase 1: Base de Datos (SQL)

### 1.1 Nueva Migración SQL
Crear las tablas `legal_areas` (materias) y `legal_area_stages` (etapas procesales).
Agregar columnas `legal_area_id` y `stage_id` a la tabla `cases`.

### 1.2 Seeder de Materias y Etapas
Función RPC `seed_default_legal_areas` para poblar Penal, Civil, Familiar, etc.
*Nota: Penal usa "Carpeta de Investigación" como primera etapa.*

### 1.3 Migración Segura de Datos Existentes
Script para mapear los textos `legal_area` antiguos a los nuevos IDs dinámicos.

### 1.4 Función RPC: Cambio de Etapa con Audit Trail (FR-02)
Función `update_case_stage` que actualiza el expediente y crea un registro en `case_updates` con el historial del cambio.

---

## Fase 2: Backend — Server Actions
- Actualizar `createCase` y `updateCaseStage`.
- Integrar el seeder en el flujo de `onboarding`.

---

## Fase 3: Frontend
- **Kanban Board**: Las columnas ahora se generan dinámicamente según la materia filtrada.
- **Formulario**: El select de etapa procesal reacciona a la materia seleccionada.
- **i18n**: Limpieza del término "Detenido".

---

## Fase 4: Verificación
- Build exitoso.
- Testing de migración de datos.
- Validación de tipos TypeScript.
