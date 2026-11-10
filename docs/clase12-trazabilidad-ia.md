# Clase 12: US-16, IA y trazabilidad

Fuente de verdad: `taskflow_especificacion_requerimientos.docx`, US-16 y convenciones generales de fechas y autenticación. Ejecución: 10/11/2026, Node 22, `TZ=America/Montevideo`, Jest/Supertest, base SQLite de pruebas. Herramienta de asistencia: Codex. Los resultados son observaciones de ejecución, no una revisión humana independiente.

## Prompts y evaluación

**Primera instrucción.** «Actuá como QA de API. Con la US-16 y sus ocho criterios, Express, Jest y Supertest, proponé tests para PATCH y GET de tareas. Usá las rutas y helpers existentes. Incluí límites y autorización; no inventes reglas ni arregles defectos. Devolvé tests con asserts del contrato y la trazabilidad a cada criterio».

**Segunda instrucción encadenada.** «Revisá los tests anteriores contra cada criterio de US-16 y las convenciones generales. Señalá huecos y propuestas no sustentadas. Agregá pruebas que distingan un día inexistente de uno válido y que verifiquen autenticación, sin asumir endpoints nuevos».

La segunda ronda añadió un día inexistente y un pedido sin token. Esta revisión amplió escenarios, pero aún requiere revisión humana: la cobertura no demuestra que el test ni su interpretación sean correctos. Un día inexistente no es una fecha calendario válida, por lo que se interpreta como rechazo bajo CA-1/CA-6; confirmar con el equipo la respuesta exacta si la especificación se precisa. Se descartan una ruta `PUT /due-date` inexistente, exigir 422 para una fecha pasada y un assert que solo verifique que existe el body. No se simuló una evaluación de varias herramientas ni una aprobación humana que no ocurrieron.

## Matriz de trazabilidad y clasificación

| Criterio | Test o evidencia | Resultado en UTC-3 | Clasificación |
| --- | --- | --- | --- |
| CA-1 día calendario sin hora | `guarda y devuelve el mismo día calendario ISO` y `rechaza una fecha imposible` | Fallan: devuelve día anterior; 2026-02-30 devuelve 200 | Rojo: defectos reales; el código normaliza el día imposible |
| CA-2 formato ISO | `guarda y devuelve el mismo día calendario ISO` | 200, pero devuelve 2026-09-14 por 2026-09-15 | Rojo: valor incorrecto |
| CA-3 independencia de zona | Mismo test con `TZ=America/Montevideo` | Falla por desplazamiento de un día | Rojo: defecto real; no se probaron todas las zonas |
| CA-4 fecha opcional | `permite una tarea sin fecha` | 200 y null | Verde y correcto |
| CA-5 quitar con null | `quita la fecha enviando null` | 200 y null en respuesta y lectura posterior | Verde y correcto |
| CA-6 formato inválido | `rechaza el formato inválido con 400` | 400 VALIDATION_ERROR | Verde y correcto |
| CA-7 fecha pasada | `acepta una fecha pasada` | 200, pero devuelve 2019-12-31 por 2020-01-01 | Rojo por zona horaria; la aceptación HTTP sí funciona. Falta verificar que la aplicación la considere vencida |
| CA-8 solo miembros | `impide a un no miembro modificar la fecha` | Esperado 403; obtenido 200 | Rojo: defecto de autorización |
| Regla general de autenticación | `rechaza actualizar la fecha sin autenticación` | 401 UNAUTHORIZED | Verde y correcto |

Los tests están en `server/tests/due-date.test.ts`. No se deshabilitaron los fallos de producto. Las pruebas comparten una tarea; aunque no dependen de un estado previo para sus asserts principales, conviene crear datos por caso para mayor aislamiento. La clasificación de CA-7 identifica lo que el test todavía no prueba.

## Cobertura y comparación

| Medición | Líneas | Ramas | Pruebas |
| --- | ---: | ---: | --- |
| Antes de US-16 | 75,75 % | 50,64 % | 53 pasan, 4 fallan |
| Primera ronda | 79,23 % | 52,78 % | 56 pasan, 7 fallan |
| Segunda ronda | 79,23 % | 52,78 % | 57 pasan, 8 fallan |

Medición con `TZ=America/Montevideo npm run test:coverage`. La segunda ronda agregó un caso válido que pasa y otro que detecta una fecha imposible aceptada, sin aumentar la cobertura global. La mejora se juzga por el defecto adicional detectado, no por el porcentaje. Los 4 fallos previos corresponden a registro y creación de proyectos. No se cambiaron reglas de negocio para forzar verde.

## Criterios propuestos de uso de IA

- Compartir solo información autorizada, sin tokens, secretos ni datos reales innecesarios.
- Conservar prompts, fuente de verdad y resultados reproducibles; distinguir hechos de suposiciones.
- Una persona revisa los tests, asserts, código y riesgos antes de aceptar cambios; el pipeline verifica, pero no reemplaza esa revisión.
- No omitir, debilitar ni marcar como resueltos los tests rojos para alcanzar un umbral.
