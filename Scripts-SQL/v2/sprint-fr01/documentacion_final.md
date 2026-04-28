# Documentación Técnica: Refactorización de Máquina de Estados y Auditoría
**Proyecto:** Abogado-Sala (LegalTech)  
**Sprint:** Sprint Actual - Corrección FR-01 y FR-02  
**Fecha:** 28 de Abril de 2026  

## 1. Contexto y Problemas Resueltos

Antes de esta intervención, el sistema de gestión de expedientes presentaba dos limitaciones críticas para su escalabilidad en el sector legal:

1.  **Estados Procesales Estáticos (FR-01):** Todos los expedientes compartían una lista de estados genérica ("En trámite", "Finalizado", etc.), ignorando que cada materia legal (Penal, Civil, Familiar) tiene sus propias etapas procesales técnicas (ej: Carpeta de Investigación vs. Demanda).
2.  **Falta de Trazabilidad y Error Semántico (FR-02):** Los cambios de estado eran directos y no dejaban rastro histórico. Además, se utilizaba el término "Detenido", el cual es legalmente incorrecto en el contexto de un expediente administrativo/judicial (se sustituyó por "Pausado").

---

## 2. Arquitectura de la Solución

Se implementó una **Máquina de Estados Dinámica** basada en relaciones de base de datos en lugar de enums estáticos.

### 2.1 Modelo de Datos (Esquema Relacional)
- **`legal_areas`**: Almacena las materias (Penal, Civil, etc.) por organización.
- **`legal_area_stages`**: Almacena las etapas específicas de cada materia, con orden de visualización y colores personalizados.
- **`cases` (Expedientes)**: Se añadieron llaves foráneas (`legal_area_id`, `stage_id`) para vincular cada expediente con su flujo procesal dinámico.

### 2.2 Integridad y Atomicidad (Audit Trail)
Se desarrolló la función RPC `update_case_stage`, la cual asegura que:
1.  Se valide que la nueva etapa pertenece a la materia del expediente.
2.  Se actualice el expediente.
3.  Se cree automáticamente un registro en la línea de tiempo (`case_updates`) con el detalle del cambio ("De etapa A a etapa B").
Todo lo anterior ocurre dentro de una **transacción ACID** de PostgreSQL.

---

## 3. Implementación Técnica

### 3.1 Backend (Next.js Server Actions)
- **`src/actions/cases.ts`**: Se migró la actualización de estados a la función RPC para garantizar el audit trail.
- **`src/actions/onboarding.ts`**: Se integró un seeder automático que puebla las materias legales estándar al crear un nuevo despacho.

### 3.2 Frontend (React & shadcn/ui)
- **Tablero Kanban Dinámico**: El tablero ahora detecta si hay un filtro de materia activo. Si lo hay, genera las columnas basadas en las etapas reales de esa materia. Si no, mantiene un modo de visualización legacy para compatibilidad.
- **Formulario Inteligente**: El componente `CaseForm` ahora es reactivo; al seleccionar "Materia Penal", el campo "Etapa" se actualiza para mostrar "Carpeta de Investigación", "Juzgado", etc.

### 3.3 i18n y Taxonomía
- Se estandarizó el uso de archivos JSON de traducción para eliminar strings hardcodeados.
- Se corrigió el término "Detenido" por "Pausado" en español.

---

## 4. Guía de Mantenimiento

### Cómo agregar una nueva materia legal
No es necesario tocar el código. Basta con insertar registros en las tablas de Supabase:
1. Insertar la materia en `legal_areas`.
2. Insertar sus etapas en `legal_area_stages` (asegurando el `display_order`).
El sistema reflejará el cambio automáticamente en los formularios y el Kanban.

### Regeneración de Tipos
Tras cualquier cambio en la estructura de la base de datos, es imperativo ejecutar:
`npx supabase gen types typescript --project-id ytvmdjnxdvzjiuuizijt > src/types/database.ts`

---

## 5. Validación de Resultados
- **Build:** ✅ Exitoso (Next.js Turbopack).
- **Tipado:** ✅ 100% Type-safe, sin casts `as any`.
- **Migración:** ✅ Datos antiguos mapeados correctamente a la nueva estructura dinámica.
- **Seguridad:** ✅ Políticas RLS aplicadas para multi-tenancy.
