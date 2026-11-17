**Issue:** [#12](https://github.com/Rodrigo568/taskflow_2026_s2/issues/12)

**Título:** [Tareas · Comentarios] Los comentarios se devuelven y se muestran del más reciente al más antiguo

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:** US-08 c4: "Los comentarios se devuelven ordenados por fecha ascendente, del más antiguo al más reciente"

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · Chromium 153 (Playwright 1.63.0) · zona horaria America/Montevideo (UTC-3) · commit `1a98d92` · API y SQLite locales de E2E (`npm run test:e2e`).

**Datos / precondiciones:** usuario dueño de un proyecto con la tarea "Hilo de comentarios", sin comentarios.

**Pasos:**
1. Abrir el detalle de la tarea.
2. Publicar, en este orden, los comentarios `Primero`, `Segundo` y `Tercero`.
3. Recargar la página.

**Esperado:** la lista muestra `Primero`, `Segundo`, `Tercero` (Gherkin de US-08: "Comentarios se devuelven en orden cronológico").

**Obtenido:** la lista muestra `Tercero`, `Segundo`, `Primero`. `GET /api/tasks/:id/comments` devuelve el mismo orden invertido.

**Reproducibilidad:** 3 de 3 (`--repeat-each=3`, 17/11/2026). No depende de la zona horaria ni del navegador.

**Evidencia:**
- Playwright: `Expected: ["Primero","Segundo","Tercero"] · Received: ["Tercero","Segundo","Primero"]`.
- Causa probable: `listByTask` en `server/src/modules/comments/comments.repository.ts` usa `orderBy: { createdAt: 'desc' }`.
- Los tests de API de `server/tests/comments.test.ts` crean un solo comentario, así que no cubren el orden.

**Test que lo reproduce:** `e2e/tests/us08-comentarios.spec.ts` › `US-08 c3 · muestra los comentarios del más antiguo al más reciente` (marcado con `test.fail()`; Playwright avisa cuando se corrija).

**Impacto:** las conversaciones se leen al revés y las respuestas aparecen antes que la pregunta que contestan.

**Severidad:** baja
