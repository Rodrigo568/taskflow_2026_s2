**Issue:** [#8](https://github.com/Rodrigo568/taskflow_2026_s2/issues/8)

**Título:** [API Auth] El registro acepta contraseñas de 7 caracteres

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:** US-01 c3: "La contraseña debe tener mínimo 8 caracteres, al menos 1 número y 1 mayúscula"

Hallazgo RF-001 de `reports/reporte_hallazgos_endpoints.xlsx`.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · Jest + Supertest con SQLite temporal. No aplica navegador. Primera detección: macOS 26.6.2 arm64, Node 22.12.0, commit `faf8d95` (17/9/2026).

**Datos / precondiciones:** no existe un usuario con email `password-corta@test.com`.

**Pasos:**
1. Enviar `POST /api/auth/register` con `{"email":"password-corta@test.com","password":"Passw1A"}` (7 caracteres, con número y mayúscula).
2. Revisar el status.

**Esperado:** HTTP 400 con `error.code` VALIDATION_ERROR y un mensaje que mencione el requisito de contraseña (US-01 c6 y Gherkin "Registro falla con contraseña débil").

**Obtenido:** HTTP 201, se crea el usuario y se devuelve un token.

**Reproducibilidad:** 2 de 2 (macOS 17/9 y Windows 17/11). Determinístico.

**Evidencia:** `npx jest tests/auth.test.ts`: `Expected: 400 · Received: 201`. Los casos de 8 y 9 caracteres pasan, así que el límite está corrido en uno.

**Test que lo reproduce:** `server/tests/auth.test.ts` › `rechaza una contraseña de 7 caracteres`.

**Impacto:** se permiten contraseñas más débiles que las exigidas por la política.

**Severidad:** media
