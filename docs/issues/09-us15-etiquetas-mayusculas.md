**Issue:** [#10](https://github.com/Rodrigo568/taskflow_2026_s2/issues/10)

**Título:** [Tareas · Etiquetas] Agregar "Bug" y después "BUG" deja dos etiquetas distintas en la tarea: no se normalizan a minúsculas

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:**
- US-15 c1: "Las etiquetas se guardan normalizadas a minúsculas y sin espacios al inicio ni al final"
- US-15 c2: "Las etiquetas no distinguen mayúsculas de minúsculas: 'Bug', 'BUG' y 'bug' son la misma etiqueta"

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · Chromium 153 (Playwright 1.63.0) · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · API y SQLite locales de E2E (`npm run test:e2e`).

**Datos / precondiciones:** usuario dueño de un proyecto con la tarea "Error en el tablero", sin etiquetas.

**Pasos:**
1. Abrir el detalle de la tarea.
2. En "Etiquetas" escribir `Bug` y pulsar "Agregar etiqueta".
3. Escribir `BUG` y pulsar "Agregar etiqueta".
4. Recargar la página.

**Esperado:** la tarea tiene exactamente 1 etiqueta y se llama `bug` (Gherkin de US-15: "Las etiquetas no distinguen mayúsculas de minúsculas").

**Obtenido:** la tarea muestra 2 etiquetas, `Bug` y `BUG`; los dos POST responden 201.

**Reproducibilidad:** 3 de 3 (`--repeat-each=3`). No depende de la zona horaria ni del navegador (el nombre se guarda tal cual en la API).

**Evidencia:**
- Playwright: `expect(getByTestId('tag-chip')).toHaveCount(1)` → `Expected: 1 · Received: 2`.
- Respuestas: `POST /api/tasks/task-N/tags {"name":"Bug"}` → `201 {"name":"Bug"}`; `{"name":"BUG"}` → `201 {"name":"BUG"}`.
- Causa probable: `addTag` en `server/src/modules/tasks/tasks.service.ts` hace `rawName.trim()` pero no `.toLowerCase()`, y busca el tag por nombre exacto.

**Test que lo reproduce:** `e2e/tests/us15-etiquetas.spec.ts` › `US-15 c2 · "Bug" y "BUG" son la misma etiqueta: no se duplica` (marcado con `test.fail()`; Playwright avisa cuando se corrija).

**Impacto:** la misma categoría queda partida en varias etiquetas, y filtrar o buscar por etiqueta deja tareas afuera.

**Severidad:** media
