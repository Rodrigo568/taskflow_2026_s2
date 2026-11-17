**Issue:** [#7](https://github.com/Rodrigo568/taskflow_2026_s2/issues/7)

**Título:** [API Tareas · Vencimiento] PATCH /tasks/:id acepta un día que no existe (2026-02-30) y lo guarda como otra fecha

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:**
- US-16 c1: "La fecha de vencimiento es un día calendario, sin hora"
- US-16 c6: "Una fecha con formato inválido devuelve HTTP 400"

Defecto de US-16 registrado en `docs/clase12-trazabilidad-ia.md` (segunda ronda de prompts).

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · servidor en America/Montevideo (UTC-3) y en UTC · commit `3c04450` · Jest + Supertest con SQLite temporal. No aplica navegador. También reproducido en macOS con Node 22 (10/11/2026).

**Datos / precondiciones:** usuario miembro del proyecto de una tarea existente.

**Pasos:**
1. Enviar `PATCH /api/tasks/{taskId}` con `{"dueDate":"2026-02-30"}`.
2. Revisar el status y el `dueDate` devuelto.

**Esperado:** HTTP 400 VALIDATION_ERROR: el 30 de febrero no es un día calendario.

**Obtenido:** HTTP 200 y la fecha se guarda normalizada a otro día (`new Date('2026-02-30')` es `2026-03-02T00:00:00.000Z`), sin avisar al usuario.

**Reproducibilidad:** 2 de 2 en Windows (con `TZ=America/Montevideo` y con `TZ=UTC`); también en macOS. No depende de la zona horaria.

**Evidencia:**
- `npx jest tests/due-date.test.ts`: `Expected: 400 · Received: 200`.
- Causa probable: `parseDueDate` en `server/src/lib/ids.ts` solo valida el patrón `YYYY-MM-DD` y que `new Date()` no sea `NaN`; JavaScript desborda el día al mes siguiente en lugar de rechazarlo.

**Test que lo reproduce:** `server/tests/due-date.test.ts` › `rechaza una fecha imposible aunque siga el formato ISO (CA-1, CA-6)`.

**Impacto:** un error de tipeo en la API guarda en silencio una fecha distinta de la pedida. Desde la UI no se puede provocar porque el `<input type="date">` no permite días inexistentes.

**Severidad:** media
