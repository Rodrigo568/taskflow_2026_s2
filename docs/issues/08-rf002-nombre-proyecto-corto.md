**Issue:** [#9](https://github.com/Rodrigo568/taskflow_2026_s2/issues/9)

**Título:** [API Proyectos] POST /projects crea proyectos sin nombre, con nombre en blanco o de 2 caracteres

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:** US-03 c1: "El nombre del proyecto es obligatorio y tiene entre 3 y 100 caracteres"

Hallazgo RF-002 de `reports/reporte_hallazgos_endpoints.xlsx`.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · Jest + Supertest con SQLite temporal. No aplica navegador. Primera detección: macOS 26.6.2 arm64, Node 22.12.0, commit `faf8d95` (17/9/2026).

**Datos / precondiciones:** usuario registrado con un token válido.

**Pasos:**
1. Enviar `POST /api/projects` con `Authorization: Bearer <token>` y el cuerpo `{}` (sin nombre).
2. Repetir con `{"name":"  "}`.
3. Repetir con `{"name":"ab"}`.
4. Revisar el status de cada uno.

**Esperado:** HTTP 400 con `error.code` VALIDATION_ERROR en los tres casos.

**Obtenido:** HTTP 201 en los tres: se crean proyectos sin nombre, con nombre en blanco y con 2 caracteres. El límite superior (101 caracteres → 400) sí funciona.

**Reproducibilidad:** 2 de 2 (macOS 17/9 y Windows 17/11), en los tres casos. Determinístico.

**Evidencia:** `npx jest tests/projects.test.ts`: tres veces `Expected: 400 · Received: 201`.

**Test que lo reproduce:** `server/tests/projects.test.ts` › `POST /api/projects` › `rechaza crear un proyecto sin nombre`, `rechaza crear un proyecto con nombre vacío` y `rechaza crear un proyecto con 2 caracteres`.

**Impacto:** aparecen proyectos sin nombre en la lista, imposibles de distinguir entre sí.

**Severidad:** media
