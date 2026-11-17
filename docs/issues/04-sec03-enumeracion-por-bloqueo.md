**Issue:** [#5](https://github.com/Rodrigo568/taskflow_2026_s2/issues/5)

**Título:** [API Auth] El login revela qué emails están registrados: desde el 6.º intento fallido responde "Account temporarily locked" solo para cuentas existentes

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:** RNF Seguridad 3: "Los mensajes de error no revelan la existencia de cuentas, ni datos de otros usuarios, ni detalles internos del sistema."

Hallazgo SEC-03 de `docs/seguridad-accesibilidad.md`.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · Chromium 153 (Playwright 1.63.0) · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · API y SQLite locales de E2E (`npm run test:e2e`). También reproducido en macOS arm64 con Node 22 (9/11/2026).

**Datos / precondiciones:** una cuenta registrada `bloqueo-<uuid>@test.com` / `Password1`, y un email no registrado `ausente-bloqueo-<uuid>@test.com`.

**Pasos:**
1. Enviar 8 veces `POST /api/auth/login` con el email registrado y la contraseña `incorrecta`.
2. Intercalar 8 envíos iguales con el email no registrado.
3. Comparar los mensajes de error de ambos.
4. Enviar el login con la contraseña correcta de la cuenta registrada.

**Esperado:** respuestas indistinguibles para la cuenta existente y la inexistente (mismo status y mismo mensaje).

**Obtenido:** las dos devuelven 401, pero a partir del 6.º intento la cuenta existente responde `Account temporarily locked. Try again later.` y la inexistente sigue con `Invalid credentials`. Durante el bloqueo también se rechaza la contraseña correcta.

**Reproducibilidad:** 3 de 3 (`--repeat-each=3`, 17/11/2026) en Windows; también en macOS.

**Evidencia:** test de Playwright (por API) que fija el comportamiento observado: verifica los dos mensajes distintos, así que **pasa mientras el bug exista**. Cuando se corrija hay que cambiarle el assert para que exija mensajes iguales.

**Test que lo reproduce:** `e2e/tests/seguridad-accesibilidad.spec.ts` › `compara bloqueo de cuenta existente e inexistente`.

**Impacto:** permite confirmar qué emails tienen cuenta y bloquear a propósito a otra persona por un rato (denegación dirigida).

**Severidad:** media
