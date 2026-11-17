**Issue:** [#11](https://github.com/Rodrigo568/taskflow_2026_s2/issues/11)

**Título:** [Tareas · Etiquetas] Agregar dos veces la misma etiqueta la duplica en la tarea y responde 201 en vez de 200

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:** US-15 c3: "Una tarea no puede tener la misma etiqueta más de una vez; volver a agregarla devuelve HTTP 200 y no genera un duplicado"

Relacionado con #10 (las etiquetas no se normalizan a minúsculas); este ocurre aun con el mismo nombre exacto.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · Chromium 153 (Playwright 1.63.0) · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · API y SQLite locales de E2E (`npm run test:e2e`).

**Datos / precondiciones:** usuario dueño de un proyecto con la tarea "Etiqueta repetida", sin etiquetas.

**Pasos:**
1. Abrir el detalle de la tarea.
2. En "Etiquetas" escribir `bug` y pulsar "Agregar etiqueta" (responde 201, correcto).
3. Volver a escribir `bug` y pulsar "Agregar etiqueta".
4. Recargar la página.

**Esperado:** el segundo POST responde HTTP 200 y la tarea tiene exactamente 1 etiqueta `bug` (Gherkin de US-15: "Agregar la misma etiqueta dos veces no la duplica").

**Obtenido:** el segundo POST responde HTTP 201 y la tarea muestra dos chips `bug`.

**Reproducibilidad:** 3 de 3 (`--repeat-each=3`). No depende de la zona horaria ni del navegador.

**Evidencia:**
- Playwright: `Expected: 200 · Received: 201` en el segundo `POST /api/tasks/task-N/tags`.
- Causa probable: `addTag` en `server/src/modules/tasks/tasks.service.ts` reutiliza el tag existente pero crea siempre una fila nueva en `task_tags`; el modelo `TaskTag` de `schema.prisma` no tiene `@@unique([taskId, tagId])`. El cliente ya lo evidencia: usa `` key={`${tag.id}-${index}`} `` porque el mismo id puede repetirse.

**Test que lo reproduce:** `e2e/tests/us15-etiquetas.spec.ts` › `US-15 c3 · agregar la misma etiqueta dos veces devuelve 200 y no la duplica` (marcado con `test.fail()`; Playwright avisa cuando se corrija).

**Impacto:** la tarea muestra etiquetas repetidas, y cada duplicado cuenta para el máximo de 10 etiquetas (US-15 c5), así que se puede llegar al límite con menos etiquetas reales.

**Severidad:** media
