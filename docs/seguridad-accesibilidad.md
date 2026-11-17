# Práctica de seguridad y accesibilidad

Ejecución local, 9 de noviembre de 2026. API Express y SQLite de prueba, Node 22, macOS arm64, Chromium de Playwright. El proyecto usa `/api`, `server/`, `client/` y `e2e/`; el registro está dentro del login. La guía de clase utiliza otra estructura y otros usuarios.

## Dependencias

`npm audit` en `server/`: 11 vulnerabilidades high, 1 moderate y 7 low. `npm audit --omit=dev`: 6 high y 1 moderate. Las auditorías son una fotografía del lockfile y de los avisos disponibles al ejecutarlas.

El repositorio no usa un único workspace npm: también se ejecutó `npm audit` en la raíz (1 critical) y `npm audit --omit=dev` en `client/` (3 high). No se suman estos totales porque pueden incluir dependencias repetidas.

| Dependencia | Clasificación | Remediación informada por npm |
| --- | --- | --- |
| body-parser, transitiva de Express | Producción, high. GHSA-27r3-jxmh-p828 describe posible denegación de servicio con cuerpo comprimido. | Express 4.22.3, sin cambio mayor según npm. Validar compatibilidad antes de actualizar. |
| underscore, transitiva de Pact | Herramientas de test, high. GHSA-qpx9-hpmf-5gmw describe recursión sin límite. | Pact 17.1.4, cambio mayor según npm. El riesgo depende de los datos procesados por las pruebas. |

## Hallazgos de seguridad

Los puntajes base y vectores se verificaron con la calculadora de FIRST. La clasificación CVSS usa el impacto observado y se registra aparte de la severidad de triaje de los tickets del equipo.

### SEC-01: edición de tarea ajena por ID — CVSS 5,4 (media)

[`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N`](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N). La edición requiere una cuenta común y se realiza por red sin participación de la víctima. La respuesta también revela campos de la tarea ajena. Se contabilizan impactos parciales en confidencialidad e integridad dentro de la misma aplicación.

Un usuario autenticado que no pertenece al proyecto puede cambiar campos de una tarea ajena. La ruta PATCH no aplica `requireTaskProjectMember`; la autorización específica de estado no protege los demás campos.

Reproducción: registrar A y B; A crea un proyecto y una tarea; B envía `PATCH /api/tasks/{id}` con `{"title":"Modificada por tercero"}`. Esperado: 403 o 404. Obtenido: 200 y título modificado. Impacto: alteración de datos de otros usuarios. Remediación: verificar membresía en todas las rutas de modificación y eliminación, y probar roles y no miembros.

### SEC-02: configuración HTTP permisiva — CVSS 0,0 (informativo)

[`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N`](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N). Los headers se pueden observar por red sin autenticación. En el entorno evaluado, la configuración por sí sola no demostró pérdida de confidencialidad, integridad ni disponibilidad. Las alertas de hardening conservan la severidad propia de ZAP.

`curl -I /api/health` devolvió `X-Powered-By: Express` y `Access-Control-Allow-Origin: *`; no devolvió CSP, HSTS, X-Frame-Options ni X-Content-Type-Options. Impacto: exposición de tecnología y ausencia de defensas de navegador; el riesgo de CORS depende de credenciales y despliegue. Remediación: definir orígenes permitidos, ocultar el header y configurar headers apropiados para el frontend y HTTPS en producción. HSTS solo opera sobre HTTPS.

### SEC-03: enumeración de cuentas mediante bloqueo — CVSS 6,5 (media)

[`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L`](https://www.first.org/cvss/calculator/3.1#CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L). El login público distingue si existe la cuenta y permite bloquearla temporalmente sin credenciales ni participación de la víctima. Los impactos son parciales en confidencialidad y disponibilidad, dentro del mismo servicio.

Registrar una cuenta descartable y enviar ocho intentos de login con contraseña incorrecta, comparándolos con ocho intentos a un correo inexistente. Esperado: respuestas indistinguibles. Obtenido: ambos devuelven 401, pero desde el sexto intento la cuenta existente responde `Account temporarily locked. Try again later.` y la inexistente `Invalid credentials`. Una contraseña correcta también se rechaza durante el bloqueo. Impacto: permite confirmar cuentas y bloquear temporalmente a otras personas. Remediación: respuestas uniformes y límites de intentos que consideren origen y cuenta sin facilitar bloqueo dirigido. Evidencia reproducible: test `compara bloqueo de cuenta existente e inexistente`.

## Controles y pruebas exploratorias

| Prueba | Esperado | Observado y explicación |
| --- | --- | --- |
| B lista tareas del proyecto privado de A | 403 o 404 | 403 FORBIDDEN. `requireProjectMember` verifica membresía. |
| B cambia el estado de la tarea de A | 403 o 404 | 403 FORBIDDEN. `assertCanChangeStatus` comprueba asignado o administrador. |
| B consulta GET del proyecto de A | 403 o 404 | 404 `Endpoint not found`: esta API no tiene GET individual de proyecto; no demuestra control de propiedad. |
| SQL en email de login | Rechazo | 401; la consulta usa Prisma, sin concatenar SQL. |
| SQL en búsqueda | Sin obtener todas las tareas | 200 con lista vacía; Prisma trata el texto como valor de filtro. |
| JWT `alg: none` | Rechazo | 401; `jwt.verify` valida la firma. |
| Asignar tarea a usuario externo | 400, sin asignación | 400 `The assignee must be a member of the project`, usando el campo real `assigneeId`. |
| XSS almacenado en título | Mostrar texto, sin ejecutar código | En Chromium, `<img src=x onerror=alert(1)>` apareció como texto en el tablero y como valor del input en detalle. Sin imagen ni diálogo. React renderiza el texto sin interpretarlo como HTML. |

Estas pruebas cubren los casos indicados y no demuestran ausencia de vulnerabilidades generales. Los dos últimos controles son reproducibles con `e2e/tests/seguridad-accesibilidad.spec.ts`.

## Baseline pasivo de OWASP ZAP

El 17/11/2026 se ejecutó [ZAP Baseline](https://www.zaproxy.org/docs/docker/baseline-scan/) 2.17.0 con el spider y las reglas pasivas. El entorno fue TaskFlow local con Vite, Express y una base SQLite descartable. Sin autenticación, el spider reportó 7 URL para el frontend y 6 para la API. Los reportes originales conservan las alertas con sus instancias y severidades.

| Evidencia | Cruce con la revisión manual |
| --- | --- |
| [HTML de la API](evidencia/zap-api.html) | SEC-02. `/api/health` devolvió 200 y ZAP confirmó la falta de `nosniff` (10021), la exposición de `X-Powered-By` (10037) y CORS permisivo (10098). También registró la caché como observación informativa (10049). El spider advirtió que `/` de Express devuelve 404, esperado para ese servidor. |
| [HTML del frontend](evidencia/zap-web.html) | SEC-02. El HTML local carece de CSP (10038) y protección contra framing (10020). ZAP también señaló CORS, `nosniff` y headers adicionales en Vite. Las observaciones de este servidor de desarrollo requieren comprobación en el despliegue final. |
| SEC-01 y SEC-03 | Se verificaron mediante los controles manuales y de integración descriptos arriba. El baseline observa tráfico público y no cubre edición por otro usuario ni intentos repetidos de login. |

HSTS queda para verificar en un entorno con HTTPS. Para reproducir los reportes en Docker Desktop con la app local en los puertos de Playwright, ejecutar desde una carpeta de salida vacía:

```sh
zap_image=ghcr.io/zaproxy/zaproxy@sha256:9624669db72f54d86c4b46a7064518bd9bf79d8c61a4c31befa9923489f328af
docker run --rm -v "$PWD:/zap/wrk:rw" "$zap_image" zap-baseline.py -t http://host.docker.internal:5174 -I -T 5 -r zap-web.html
docker run --rm -v "$PWD:/zap/wrk:rw" "$zap_image" zap-baseline.py -t http://host.docker.internal:3100/api/health -I -T 5 -r zap-api.html
```

Para el frontend se habilitó `host.docker.internal` en Vite mediante `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` durante la ejecución. `-I` conserva las alertas en los reportes y evita que las advertencias por sí solas den código de salida de fallo.

## Accesibilidad

Se ejecutó axe con WCAG 2.1 A/AA en login, registro, proyectos, tablero y detalle. Antes de la corrección, el detalle presentó la regla `label` (impacto critical de axe; WCAG 4.1.2 nivel A):

| ID | Elemento | Principio | Hallazgo y remediación |
| --- | --- | --- | --- |
| ACC-01 | `tag-add-input` | Robusto | Input sin nombre accesible; corregido con `aria-label`. |
| ACC-02 | `comment-add-input` | Robusto | Textarea sin nombre accesible; corregido con `aria-label`. |
| ACC-03 | Botón `tag-remove-button` en detalle | Robusto, WCAG 4.1.2 nivel A | Chromium exponía `×` como nombre. Cada botón ahora expone `Eliminar etiqueta <nombre>`. La regresión comprueba que las etiquetas `urgente` y `diseño` reciben nombres distintos. |

Tras la corrección, axe no reportó `label` en detalle y no reportó violaciones en las vistas analizadas. El test guarda los JSON como adjuntos de Playwright. En Chromium se recorrió la lista mediante pulsaciones Tab y se abrió un proyecto con Enter. La etiqueta `html` declara `lang="es"`; un login incorrecto muestra `Invalid credentials` mediante `role="alert"`. El mensaje describe el fallo, aunque aparece en inglés. Se verificaron el DOM y el comportamiento con Playwright, sin una sesión de lector de pantalla ni una revisión visual humana del foco.

## Historias de remediación

**Seguridad.** Como miembro de un proyecto, quiero que solo usuarios autorizados modifiquen sus tareas, para proteger sus datos.

- CA-01: PATCH y DELETE de un no miembro devuelven 403 o 404 y no modifican datos.
- CA-02: los miembros con permiso pueden editar según las reglas de rol.
- CA-03: tests de integración cubren usuario ajeno, miembro y propietario para cada ruta afectada.

**SEC-02.** Como responsable del despliegue, quiero limitar los orígenes y configurar los headers HTTP para reducir la exposición de la API y proteger la interfaz en el navegador.

- CA-01. `/api/health` y una ruta protegida devuelven `X-Content-Type-Options: nosniff` y omiten `X-Powered-By`.
- CA-02. El HTML servido por HTTPS incluye CSP con `frame-ancestors 'none'` y HSTS. El login y las operaciones de tareas pasan con esa política habilitada.
- CA-03. Un origen explícitamente permitido recibe su origen exacto en CORS. Un origen ajeno no recibe `Access-Control-Allow-Origin` y los tests cubren ambos casos.

**SEC-03.** Como persona con cuenta, quiero que los intentos fallidos reciban respuestas uniformes y tengan límites adecuados para proteger mi identidad y mantener el acceso legítimo.

- CA-01. Para un correo existente y otro inexistente, las secuencias equivalentes de intentos fallidos devuelven el mismo estado, esquema y mensaje, incluso al alcanzar el límite.
- CA-02. Exceder el límite de un origen provoca `429` con `Retry-After`. Un origen distinto puede ingresar con credenciales válidas a la misma cuenta.
- CA-03. Con un reloj controlado, los tests comprueban el restablecimiento tras el plazo y que un login exitoso reinicia el contador aplicable.

**Dependencias de `npm audit`.** Como responsable de mantenimiento, quiero actualizar las cadenas de Express y Pact reportadas por npm para reducir el riesgo en producción y en la ejecución de pruebas.

- CA-01. `npm --prefix server audit --omit=dev --json` deja de informar `GHSA-27r3-jxmh-p828` en la cadena de Express y el build de la API pasa.
- CA-02. `npm --prefix server audit --json` deja de informar `GHSA-qpx9-hpmf-5gmw` en la cadena de Pact.
- CA-03. Con instalación limpia desde los lockfiles actualizados, se ejecutan los contratos existentes y no aparecen regresiones en los casos HTTP que pasaban antes del cambio.

**Accesibilidad.** Como persona que usa tecnología asistiva, quiero identificar los campos y la tarea abierta, para completar el formulario de manera autónoma.

- CA-01: axe no informa `label` en detalle de tarea.
- CA-02: el botón de cada etiqueta expone un nombre que indica la acción y la etiqueta correspondiente.
- CA-03: los controles se alcanzan y utilizan con teclado y conservan foco visible.

## Ejecución

El 17/11/2026 pasaron las ocho pruebas de `seguridad-accesibilidad` y `a11y` en Chromium. Axe reportó cero violaciones WCAG 2.1 A/AA en las cinco vistas revisadas. También pasó el caso de US-15 que agrega y quita una etiqueta. El motor local de migraciones de Prisma devolvió `Schema engine error`. Se aplicó la migración SQL con `sqlite3` en una base temporal y se corrió Playwright contra los servidores locales ya iniciados. La configuración del repo conserva su arranque habitual para CI.
