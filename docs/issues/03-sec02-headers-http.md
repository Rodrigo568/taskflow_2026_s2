**Issue:** [#4](https://github.com/Rodrigo568/taskflow_2026_s2/issues/4)

**Título:** [API] Las respuestas exponen X-Powered-By: Express, permiten CORS desde cualquier origen y no envían headers de seguridad

**Etiqueta:** `bug` (la severidad va en su propia sección)

**Criterio violado:**
- RNF Seguridad 3: "Los mensajes de error no revelan […] detalles internos del sistema." El header `X-Powered-By` informa la tecnología del servidor en todas las respuestas.
- No hay un criterio de la spec sobre CORS ni sobre CSP, HSTS, X-Frame-Options o X-Content-Type-Options; se reporta como configuración insegura (OWASP A05: Security Misconfiguration).

Hallazgo SEC-02 de `docs/seguridad-accesibilidad.md`.

**Entorno:** Windows 11 Pro 10.0.26200 · Node v24.22.1 · zona horaria America/Montevideo (UTC-3) · commit `3c04450` · API local (`npx ts-node src/index.ts`). No aplica navegador: `curl`. También reproducido en macOS arm64 con Node 22 (9/11/2026).

**Datos / precondiciones:** ninguna; no requiere autenticación.

**Pasos:**
1. Levantar la API.
2. Ejecutar `curl -I http://localhost:3000/api/health`.

**Esperado:** sin `X-Powered-By`; `Access-Control-Allow-Origin` limitado a los orígenes del frontend; headers `Content-Security-Policy`, `X-Content-Type-Options: nosniff` y `X-Frame-Options` (y `Strict-Transport-Security` cuando se sirva por HTTPS).

**Obtenido:**
```
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
```
Sin CSP, X-Content-Type-Options ni X-Frame-Options.

**Reproducibilidad:** 2 de 2 (macOS 9/11 y Windows 17/11). Es configuración: ocurre en todas las respuestas.

**Evidencia:** salida de `curl -I` de arriba.

**Test que lo reproduce:** pendiente. Propuesta: test de Supertest sobre `GET /api/health` que exija la ausencia de `x-powered-by` y la presencia de `x-content-type-options`.

**Impacto:** facilita identificar la tecnología y no aprovecha las defensas del navegador. El riesgo de CORS `*` es bajo mientras la autenticación sea por token Bearer y no por cookies.

**Severidad:** media
