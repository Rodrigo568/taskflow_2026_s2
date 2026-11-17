# Equipo 12 — Calificaciones por equipo, Testing y Calidad de Software 2026

**Repo:** https://github.com/Rodrigo568/taskflow_2026_s2

Integrantes (del `git log`): Rodrigo568 (`rodrigodoldan04@gmail.com`; apellido sin confirmar, a verificar con la lista de inscriptos) y Martina Caballero (usuario de GitHub MartiCaballero, deducido del autor del issue #1).

Este archivo tiene solo las tareas calificadas por equipo. Las notas individuales (cuestionario de la clase 1, cuestionarios de Moodle y participación) se llevan aparte.

_Escala de las notas: 0-100._

## Tareas por equipo

| Tarea | Clase | Peso | Puntos del curso (máx., de 100) | Nota | Aporta a la final (puntos) | Observaciones |
|---|---|---|---|---|---|---|
| Taller de refinamiento | 2 | 5,3 | 2,65 | pendiente |  | Pendiente de entrega: no figura en el repo (se buscó en `docs/`, el README y la única rama, `main`). |
| Integration + cobertura + refactor (código pestilente + Ej. 1 de clase 7) | 3 y 7 | 10,6 | 5,30 | 80 | 4,24 | Refactor real de `updateTask` en `tasks.service.ts` y cobertura de 79,23 % de líneas y 52,78 % de ramas con umbral de 40 % en Jest (verificado). Faltan el listado de smells y los tests de caracterización previos al refactor. |
| Postman + Supertest, caza de bugs | 5 | 5,3 | 2,65 | 80 | 2,12 | Suite Supertest de 65 tests (57 pasan, 8 fallan contra la spec) con status, cuerpo y casos negativos. Los reportes del xlsx no tienen severidad ni reproducibilidad. Postman no se cuenta. |
| ADR | 6 | 5,3 | 2,65 | 90 | 2,38 | Framework Playwright con Component Object (`TaskCard`), Page Object, fixtures y API de datos. ADR-002 con contexto, decisión y consecuencias; faltan alternativas de herramienta y costos. |
| E2E + bugs | 7 y 8 | 10,6 | 5,30 | 36 | 1,91 | Pocos casos E2E sobre US-12, US-14, US-15 y US-16 (0, 2, 1 y 2). Los bugs están bien descritos en `docs/` y en el xlsx, pero no son GitHub issues. |
| Performance (k6: tabla seed chica vs grande + issue) | 9 | 5,3 | 2,65 | 97 | 2,57 | Tabla seed chica vs. grande, hipótesis e issue #1 completos y con el criterio de la spec citado. Al issue le falta la severidad. |
| Seguridad + accesibilidad (ZAP, axe-core, CVSS) | 11 | 5,3 | 2,65 | 62 | 1,64 | Buenos hallazgos manuales y axe-core con fix verificado. No usaron OWASP ZAP y el CVSS no tiene vector ni número. |
| Pipeline (`ci.yml` y job de E2E) | 12 | 10,6 | 5,30 | 97 | 5,14 | `ci.yml` con 5 jobs independientes, cache de npm y job de E2E en `main`. Lint rojo por 3 errores de código y cobertura roja por el gate de 80 % de líneas (79,23 %). |
| Presentación (por definir) | 16 | 15,9 | 7,95 | pendiente |  | Pendiente: todavía no la hicieron. |
| Informe de una página | 12 | 12,8 | 6,40 | 92 | 5,89 | Informe de 411 palabras con tabla de métricas y recomendación explícita de no liberar; los números coinciden con el repo. No midieron E2E en local. |
| **Total por equipo** | | **87,0** (65,8 ya calificados) | **43,50** | 78,7 (promedio ponderado de lo calificado) | **25,90** | Faltan por entregar: Taller de refinamiento y Presentación. |
| Tareas individuales (Moodle 6, participación 5, cuestionario clase 1 2; pesos provisorios) |  | 13 | 6,50 |  | pendiente | Se llevan aparte, ver `Calificacion_final.md`. |
| **Proyecto final corregido** |  |  | **50,00** | pendiente | pendiente | Vale el 50 % de la nota final. Se califica después de que arreglen lo señalado en estas tareas. |
| **Total del curso** |  |  | **100,00** |  | **25,90** de 100 (hasta ahora; faltan individuales y proyecto final) | 43,50 (equipo) + 6,50 (individuales) + 50,00 (proyecto) |

_Los 13 de peso restantes de las tareas (6,5 puntos del curso: Moodle 6, participación 5, cuestionario clase 1 2) son individuales. Pesos provisorios, pendientes de confirmar._

## Proyecto corregido

| Concepto | Nota | Observaciones |
|---|---|---|
| Nota del proyecto corregido (incluye Rúbrica C de Pact) | | |

## Sugerencias de arreglo para el equipo (2026-11-17)

Notas en escala 0-100. Los "GitHub issues" son los tickets de la pestaña Issues del repo.

### E2E + bugs
- **Bugs como GitHub issues:** SEC-01 a SEC-03 (`docs/seguridad-accesibilidad.md`), los defectos de US-16 (`docs/clase12-trazabilidad-ia.md`) y RF-001/RF-002 (`reports/reporte_hallazgos_endpoints.xlsx`) están bien descritos pero no son GitHub issues (el repo tiene solo el #1, de performance). Abrir un GitHub issue por bug con el molde del #1: título, criterio violado citando la spec, entorno, pasos, esperado/obtenido, reproducibilidad, evidencia y severidad. Hasta 30 puntos.
- **Casos E2E de US-12, US-14, US-15 y US-16:** hoy hay 0, 2, 1 y 2 casos. Agregar hasta 3 por historia en `e2e/tests/`. US-12: editar el título desde el detalle y ver que persiste; con título vacío, que se rechace. US-14: asignar, reasignar y desasignar desde la UI. US-15: agregar la etiqueta "Bug" y comprobar que no se duplica con "BUG". US-16: poner, quitar y mostrar el vencimiento. Hasta 29 puntos.

### Seguridad + accesibilidad
- **CVSS sin vector ni número:** calcular con la calculadora de first.org/cvss/calculator/3.1 y anotar el vector completo (formato `CVSS:3.1/AV:N/AC:L/...`, la cadena que describe cómo se explota la falla) y el puntaje de SEC-01 a SEC-03. Hasta 20 puntos.
- **Falta OWASP ZAP:** correr un baseline scan contra la app local, guardar el reporte HTML en `docs/` y cruzar sus hallazgos con los manuales. Hasta 11 puntos.
- **Stories de remediación incompletas:** sumar stories con criterios de aceptación para SEC-02, SEC-03 y las dependencias de `npm audit`. Hasta 5 puntos.
- **ACC-03 sin corregir:** el test `revisa el nombre accesible del botón para quitar una etiqueta` afirma el nombre `×`, que es el bug. Agregar `aria-label` con el nombre de la etiqueta y cambiar el test para que exija ese nombre.

### Integration + cobertura + refactor
- **Smells sin documentar:** agregar a `docs/` una tabla "smell, dónde estaba, refactor que lo resolvió, commit". Hasta 10 puntos.
- **Refactor sin tests previos:** el commit `ea0a46d` (extrae `buildTaskUpdate`, `resolveAssignee` y `assertCanChangeStatus`) llegó antes de los tests de `tasks.test.ts` y el fix `23dece2` está en el mismo día. Separar refactor y bugfix en commits distintos y escribir antes los tests de caracterización (fijan el comportamiento actual). Hasta 10 puntos.

### Postman + Supertest
- **Reportes de bug incompletos:** en el xlsx agregar severidad y reproducibilidad a RF-001 y RF-002, y citar el criterio de la spec (US-01 CA-3 y US-03 CA-1) en vez de "la regla del taller". Hasta 15 puntos.
- **Tests que solo miran el status:** en `comments.test.ts`, verificar también el cuerpo (autor y texto devueltos). Hasta 5 puntos.

### ADR
- **ADR sin alternativas de herramienta:** agregar a `0002-...md` por qué Playwright y no Cypress o Selenium, y los costos de mantenimiento. Hasta 4 puntos.
- **Component Objects pendientes:** implementar `CommentItem` y `MemberItem` en `e2e/components/`. Hasta 5 puntos.

### Performance
- **Issue sin severidad:** agregar la severidad (por ejemplo "media") al issue #1. Hasta 3 puntos.

### Pipeline
- **Lint rojo:** en `server/src/modules/comments/comments.service.ts` tipar `serialize` en vez de `any` (líneas 7 y 26) y quitar o renombrar a `_e` el `catch (e)` de la línea 16. Hasta 3 puntos.
- **Gate de cobertura:** el job exige 80 % de líneas y hoy hay 79,23 %. Agregar tests de `tasks.controller.ts` (60 % de líneas) y `membership.ts`.

### Informe de una página
- **E2E sin medir:** el informe dice "No ejecutado" por un error de Prisma. Correr los E2E en local (por ejemplo con la base aislada de `e2e/support/fresh-db.cjs`) y agregar el resultado a la tabla. Hasta 8 puntos.

### Pendientes de entrega
- Taller de refinamiento y Presentación.
