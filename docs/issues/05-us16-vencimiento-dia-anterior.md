**Issue:** [#6](https://github.com/Rodrigo568/taskflow_2026_s2/issues/6)

**Título:** [Tareas · Vencimiento] En zonas UTC- la fecha de vencimiento se guarda bien pero se devuelve y se muestra un día antes

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:**
- US-16 c1: "La fecha de vencimiento es un día calendario, sin hora"
- US-16 c3: "La fecha que se devuelve es siempre la misma que se cargó, sin importar la zona horaria del cliente ni la del servidor"
- US-16 c7: "Se admite cargar una fecha pasada; el sistema no la rechaza" (se acepta, pero se devuelve corrida)
- Convenciones, Fechas 2: "La fecha de vencimiento […] es un día calendario sin hora […] y no se convierte entre zonas horarias."

Defecto de US-16 registrado en `docs/clase12-trazabilidad-ia.md` (CA-1, CA-2, CA-3 y CA-7).

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · Chromium 153 (Playwright 1.63.0, `timezoneId: America/Montevideo`) · servidor en America/Montevideo (UTC-3) · commit `3c04450` · API y SQLite locales de E2E (`npm run test:e2e`).

**Datos / precondiciones:** usuario dueño de un proyecto con la tarea "Entregar informe", sin vencimiento.

**Pasos:**
1. Abrir el detalle de la tarea.
2. En "Vencimiento" elegir el 15/09/2026.
3. Pulsar "Guardar".
4. Mirar "Vencimiento actual" y volver al tablero.

**Esperado:** la API responde `dueDate: "2026-09-15"` y la pantalla muestra 2026-09-15 en el detalle y en la tarjeta (Gherkin de US-16: "La fecha no cambia según la zona horaria del cliente").

**Obtenido:** el PATCH responde 200 con `dueDate: "2026-09-14"`; el detalle y la tarjeta muestran 2026-09-14. Con una fecha pasada pasa lo mismo: `2020-01-01` se muestra como `2019-12-31` (cambia día, mes y año).

**Reproducibilidad:** 3 de 3 en UTC-3 (`--repeat-each=3`). Con el servidor en `TZ=UTC` los tests de fecha pasan: depende de la zona horaria del **servidor**, no del navegador.

**Evidencia:**
- Respuesta HTTP del `PATCH /api/tasks/task-N`: `{"dueDate":"2026-09-14", ...}` para `"2026-09-15"` enviado.
- Playwright: `Expected: "2026-09-15" · Received: "2026-09-14"` y `Expected: "2020-01-01" · Received: "2019-12-31"`.
- Causa probable: `parseDueDate` en `server/src/lib/ids.ts` crea la fecha como medianoche UTC (`new Date('2026-09-15')`) y `formatDueDate` la formatea con `getFullYear/getMonth/getDate`, que usan la hora local.

**Test que lo reproduce:**
- `e2e/tests/us16-vencimiento.spec.ts` › `US-16 c1 · pone el vencimiento y se muestra el mismo día en detalle y tablero`
- `e2e/tests/us16-vencimiento.spec.ts` › `US-16 c3 · borde: muestra una fecha pasada tal como se cargó`
- `e2e/tests/board.spec.ts` › `muestra la fecha de vencimiento cargada`
- `server/tests/due-date.test.ts` › `guarda y devuelve el mismo día calendario ISO (CA-1, CA-2, CA-3)` y `acepta una fecha pasada (CA-7)`

Los E2E están marcados con `test.fail()` en zonas UTC-: cuando se corrija, Playwright avisa "expected to fail, but passed" y hay que quitar la marca.

**Impacto:** todos los usuarios en Uruguay (y cualquier zona UTC-) ven todas las fechas de vencimiento un día antes; afecta la priorización, que es el objetivo de la historia.

**Severidad:** alta
