# Práctica de seguridad y accesibilidad

Ejecución local, 9 de noviembre de 2026. API Express y SQLite de prueba, Node 22, macOS arm64, Chromium de Playwright. El proyecto usa `/api`, `server/`, `client/` y `e2e/`; el registro está dentro del login. La guía de clase utiliza otra estructura y otros usuarios.

## Dependencias

`npm audit` en `server/`: 11 vulnerabilidades high, 1 moderate y 7 low. `npm audit --omit=dev`: 6 high y 1 moderate. Las auditorías son una fotografía del lockfile y de los avisos disponibles al ejecutarlas.

| Dependencia | Clasificación | Remediación informada por npm |
| --- | --- | --- |
| body-parser, transitiva de Express | Producción, high. GHSA-27r3-jxmh-p828 describe posible denegación de servicio con cuerpo comprimido. | Express 4.22.3, sin cambio mayor según npm. Validar compatibilidad antes de actualizar. |
| underscore, transitiva de Pact | Herramientas de test, high. GHSA-qpx9-hpmf-5gmw describe recursión sin límite. | Pact 17.1.4, cambio mayor según npm. El riesgo depende de los datos procesados por las pruebas. |

## Hallazgos de seguridad

### SEC-01: edición de tarea ajena por ID — HIGH

Un usuario autenticado que no pertenece al proyecto puede cambiar campos de una tarea ajena. La ruta PATCH no aplica `requireTaskProjectMember`; la autorización específica de estado no protege los demás campos.

Reproducción: registrar A y B; A crea un proyecto y una tarea; B envía `PATCH /api/tasks/{id}` con `{"title":"Modificada por tercero"}`. Esperado: 403 o 404. Obtenido: 200 y título modificado. Impacto: alteración de datos de otros usuarios. Remediación: verificar membresía en todas las rutas de modificación y eliminación, y probar roles y no miembros.

### SEC-02: configuración HTTP permisiva — MEDIUM

`curl -I /api/health` devolvió `X-Powered-By: Express` y `Access-Control-Allow-Origin: *`; no devolvió CSP, HSTS, X-Frame-Options ni X-Content-Type-Options. Impacto: exposición de tecnología y ausencia de defensas de navegador; el riesgo de CORS depende de credenciales y despliegue. Remediación: definir orígenes permitidos, ocultar el header y configurar headers apropiados para el frontend y HTTPS en producción. HSTS solo opera sobre HTTPS.

## Controles y pruebas exploratorias

| Prueba | Esperado | Observado y explicación |
| --- | --- | --- |
| B lista tareas del proyecto privado de A | 403 o 404 | 403 FORBIDDEN. `requireProjectMember` verifica membresía. |
| B cambia el estado de la tarea de A | 403 o 404 | 403 FORBIDDEN. `assertCanChangeStatus` comprueba asignado o administrador. |
| B consulta GET del proyecto de A | 403 o 404 | 404 `Endpoint not found`: esta API no tiene GET individual de proyecto; no demuestra control de propiedad. |
| SQL en email de login | Rechazo | 401; la consulta usa Prisma, sin concatenar SQL. |
| SQL en búsqueda | Sin obtener todas las tareas | 200 con lista vacía; Prisma trata el texto como valor de filtro. |
| JWT `alg: none` | Rechazo | 401; `jwt.verify` valida la firma. |

La prueba de XSS almacenado y el recorrido manual completo con teclado quedan pendientes; no se infiere seguridad o conformidad general a partir de los controles anteriores.

## Accesibilidad

Se ejecutó axe con WCAG 2.1 A/AA en login, registro, proyectos, tablero y detalle. Antes de la corrección, el detalle presentó la regla `label` (impacto critical de axe; WCAG 4.1.2 nivel A):

| ID | Elemento | Principio | Hallazgo y remediación |
| --- | --- | --- | --- |
| ACC-01 | `tag-add-input` | Robusto | Input sin nombre accesible; corregido con `aria-label`. |
| ACC-02 | `comment-add-input` | Robusto | Textarea sin nombre accesible; corregido con `aria-label`. |
| ACC-03 | Detalle de tarea | Operable, WCAG 2.4.6 AA | Revisión de código: falta un encabezado principal que identifique la tarea; proponer un `h1` descriptivo. Este hallazgo requiere validación manual adicional. |

Tras la corrección, axe no reportó `label` en detalle y no reportó violaciones en las vistas analizadas. El test guarda los JSON como adjuntos de Playwright. `html lang="es"` está presente, los enlaces de proyectos son enlaces nativos y el error de login usa `role="alert"`; estas observaciones de código no sustituyen una prueba manual con teclado y lector de pantalla.

## Historias de remediación

**Seguridad.** Como miembro de un proyecto, quiero que solo usuarios autorizados modifiquen sus tareas, para proteger sus datos.

- CA-01: PATCH y DELETE de un no miembro devuelven 403 o 404 y no modifican datos.
- CA-02: los miembros con permiso pueden editar según las reglas de rol.
- CA-03: tests de integración cubren usuario ajeno, miembro y propietario para cada ruta afectada.

**Accesibilidad.** Como persona que usa tecnología asistiva, quiero identificar los campos y la tarea abierta, para completar el formulario de manera autónoma.

- CA-01: axe no informa `label` en detalle de tarea.
- CA-02: el detalle tiene un encabezado principal con el título de la tarea.
- CA-03: los controles se alcanzan y utilizan con teclado y conservan foco visible.

## Ejecución

`npx playwright test a11y --project=chromium --workers=1`. En esta máquina el motor de migración de Prisma falló al preparar la base; para la ejecución se creó temporalmente la base aislada de E2E mediante la migración SQL con `sqlite3`. Se restauró la configuración normal después. No se realizaron pruebas sobre producción.
