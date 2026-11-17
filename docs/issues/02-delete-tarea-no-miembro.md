**Issue:** [#3](https://github.com/Rodrigo568/taskflow_2026_s2/issues/3)

**Título:** [API Tareas] Un usuario que no es miembro del proyecto puede borrar una tarea ajena con DELETE /tasks/:id

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:**
- US-13 c1: "Solo los miembros del proyecto al que pertenece la tarea pueden eliminarla (HTTP 403)"
- RNF Seguridad 2: "Todo endpoint que opera sobre un recurso de un proyecto verifica que el usuario autenticado sea miembro vigente de ese proyecto."

Misma causa que #2 (SEC-01, PATCH sin control de membresía), en otra ruta y con pérdida de datos.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · API local con SQLite de prueba. No aplica navegador: pedido HTTP.

**Datos / precondiciones:** usuario A dueño de un proyecto con la tarea "Tarea de A"; usuario B registrado y **no** miembro del proyecto.

**Pasos:**
1. Registrar a A y a B (`POST /api/auth/register`).
2. A crea un proyecto y una tarea en él.
3. B envía `DELETE /api/tasks/{taskId}` con su token.

**Esperado:** HTTP 403 FORBIDDEN y la tarea sigue existiendo (Gherkin de US-13: "Un usuario ajeno al proyecto no puede eliminar la tarea").

**Obtenido:** HTTP 204 y la tarea se borra, junto con sus comentarios, historial y etiquetas.

**Reproducibilidad:** 1 de 1 (17/11/2026). Es determinístico: la ruta no tiene control de membresía.

**Evidencia:**
- Respuesta HTTP: `DELETE /api/tasks/task-N` con el token de B → `204 No Content`.
- Causa probable: en `server/src/modules/tasks/tasks.routes.ts` la ruta `router.delete('/:taskId', controller.remove)` no usa `requireTaskProjectMember('taskId')`, y `deleteTask` no verifica membresía.

**Test que lo reproduce:** pendiente. Propuesta: `server/tests/tasks.test.ts` › "un no miembro no puede eliminar la tarea (US-13 CA-1)", esperando 403 y que la tarea siga existiendo.

**Impacto:** cualquier usuario autenticado puede borrar de forma irreversible todas las tareas del sistema recorriendo los ids secuenciales.

**Severidad:** crítica
