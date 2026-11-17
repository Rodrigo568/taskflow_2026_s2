**Issue:** [#2](https://github.com/Rodrigo568/taskflow_2026_s2/issues/2)

**Título:** [API Tareas] Un usuario que no es miembro del proyecto puede editar una tarea ajena con PATCH /tasks/:id

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:**
- US-12 c5: "Solo los miembros del proyecto al que pertenece la tarea pueden editarla (HTTP 403)"
- US-16 c8: "Solo los miembros del proyecto pueden modificar la fecha de vencimiento (HTTP 403)"
- RNF Seguridad 2: "Todo endpoint que opera sobre un recurso de un proyecto verifica que el usuario autenticado sea miembro vigente de ese proyecto."

Hallazgo SEC-01 de `docs/seguridad-accesibilidad.md`.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · API local con SQLite de prueba. No aplica navegador: pedido HTTP. También reproducido en macOS arm64 con Node 22 (9/11/2026).

**Datos / precondiciones:** usuario A dueño del proyecto "Proyecto SEC" con la tarea "Tarea de A"; usuario B registrado y **no** miembro del proyecto.

**Pasos:**
1. Registrar a A y a B (`POST /api/auth/register`).
2. A crea un proyecto (`POST /api/projects`) y una tarea en él (`POST /api/projects/{id}/tasks`).
3. B envía `PATCH /api/tasks/{taskId}` con su token y el cuerpo `{"title":"Modificada por tercero"}`.

**Esperado:** HTTP 403 FORBIDDEN y la tarea conserva el título "Tarea de A" (Gherkin de US-12: "Un usuario ajeno al proyecto no puede editar la tarea").

**Obtenido:** HTTP 200 y la tarea queda con el título "Modificada por tercero". Lo mismo con `{"dueDate":"2026-09-15"}`.

**Reproducibilidad:** 3 de 3 veces en Windows/UTC-3 y en UTC; también en macOS. No depende de la zona horaria ni del navegador.

**Evidencia:**
- Respuesta HTTP: `PATCH /api/tasks/task-N` → `200 {"title":"Modificada por tercero", ...}`.
- `npx jest tests/due-date.test.ts`: `Expected: 403 · Received: 200`.
- Causa probable: en `server/src/modules/tasks/tasks.routes.ts` la ruta `router.patch('/:taskId', controller.update)` no usa `requireTaskProjectMember('taskId')`, que sí tienen el GET, las etiquetas y los comentarios.

**Test que lo reproduce:** `server/tests/due-date.test.ts` › `impide a un no miembro modificar la fecha (CA-8)`.

**Impacto:** cualquier usuario autenticado puede alterar tareas de cualquier proyecto; los ids son secuenciales (`task-1`, `task-2`…), así que se pueden recorrer.

**Severidad:** alta
