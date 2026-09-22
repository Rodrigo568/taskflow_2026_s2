# ADR-001: Arquitectura actual de testing de TaskFlow

- **Estado:** Aceptado (registro de la arquitectura existente)
- **Fecha:** 2026-09-22
- **Alcance:** pruebas automatizadas del backend

## Contexto

La arquitectura de testing de TaskFlow ya está implementada. Este ADR registra qué patrones usa y por qué son adecuados para probar el comportamiento de la API. No plantea una elección nueva de framework.

## Decisión registrada

El backend usa Jest 29 con `ts-jest` y el entorno Node. Las pruebas están en `server/tests/`, agrupadas por área funcional: autenticación, proyectos, tareas y comentarios. La configuración busca archivos `*.test.ts`, aplica una espera máxima de 20 segundos y ofrece un comando de cobertura.

El patrón principal es la **prueba de integración de API**. Cada caso envía solicitudes HTTP a una instancia Express creada en el proceso con Supertest. Las rutas ejecutan el middleware, los controladores, los servicios y Prisma reales; las pruebas no reemplazan esas capas con mocks. La persistencia usa SQLite temporal.

| Patrón | Dónde aparece | Uso en TaskFlow |
| --- | --- | --- |
| Prueba de integración en la frontera HTTP | `server/tests/*.test.ts`; la aplicación se arma en `server/src/app.ts` | Comprueba solicitudes, respuestas, autenticación, permisos, validaciones y persistencia desde la API. |
| Organización por funcionalidad | `auth.test.ts`, `projects.test.ts`, `tasks.test.ts`, `comments.test.ts` | Mantiene juntos los escenarios de cada área y facilita encontrar una falla por recurso. |
| Preparación de datos con helpers | `server/tests/helpers.ts` | Reutiliza registro, encabezados de autenticación y creación de proyectos y tareas. |
| Casos parametrizados | `it.each` en las pruebas de autenticación, proyectos y filtros de tareas | Ejecuta varias entradas del mismo tipo de regla con una sola estructura de prueba. |
| Arrange–Act–Assert | Los casos de las suites | Preparan usuarios y recursos, envían una solicitud y verifican estado y cuerpo de respuesta. No se separan con etiquetas explícitas. |
| Base temporal por suite | `globalSetup.ts` y `setup.ts` | Crea una base plantilla y copia una base SQLite distinta para cada archivo de pruebas. |

## Por qué convienen estos patrones

| Criterio | Relación con el patrón actual | Límite observado |
| --- | --- | --- |
| Fidelidad al comportamiento | Probar por HTTP y usar las capas reales comprueba cómo colaboran Express, la lógica de negocio y la persistencia. Es apropiado para validar contratos y reglas de la API. | No comprueba el recorrido visual ni la integración del frontend en un navegador. |
| Aislamiento y repetibilidad | Cada archivo recibe una copia independiente de la base plantilla, de modo que los datos de una suite no pasan a otra. La ejecución configurada con `--runInBand` también evita ejecutar archivos en paralelo. | Los casos de un mismo archivo comparten su base; el aislamiento no llega a cada caso individual. |
| Rapidez y sencillez de entorno | Supertest invoca Express en el proceso y SQLite es un archivo local. Esto evita levantar un servidor externo y una base separada para estas pruebas. | Incluir Prisma y la base real hace estas pruebas más costosas que pruebas unitarias de una función aislada. |
| Mantenibilidad | La separación por área funcional, los helpers de construcción y `it.each` reducen repetición y hacen explícito el escenario que se prueba. | Algunos casos solo verifican el código HTTP; por ejemplo, ciertos casos de comentarios no validan el autor o el contenido completo devuelto. |
| Diagnóstico de fallas | Los nombres de los casos describen el comportamiento y las pruebas suelen comprobar tanto el estado HTTP como códigos de error del cuerpo. | La profundidad de las aserciones varía entre suites, por lo que no todos los fallos identifican la misma cantidad de detalles. |
| Alcance de cobertura | La suite existente cubre flujos de autenticación, proyectos, tareas y comentarios, y contempla errores de permisos y validación en varios endpoints. | No se ven pruebas unitarias aisladas, pruebas del cliente, ni mediciones de carga o concurrencia. La configuración excluye `src/index.ts` y `src/types/**` del reporte de cobertura. |

## Consecuencias

- Los tests ejercitan las rutas y la persistencia que usa el backend, lo que da evidencia útil sobre la integración de la API.
- Las suites necesitan generar y copiar bases temporales, y sus casos comparten el estado dentro del mismo archivo.
- Los helpers reducen el código de preparación, pero mantienen parte del setup fuera de cada escenario; al leer un test hay que consultar `helpers.ts` para ver exactamente qué solicitudes crean sus datos.
- Esta arquitectura no aporta por sí sola evidencia sobre la interfaz web ni sobre atributos no funcionales como latencia bajo carga.

## Referencias del repositorio

- Configuración y comandos: `server/jest.config.js`, `server/package.json`, `package.json`.
- Preparación y aislamiento de la base: `server/tests/globalSetup.ts`, `server/tests/setup.ts`.
- Helpers HTTP y de datos: `server/tests/helpers.ts`.
- Aplicación Express: `server/src/app.ts`.
- Ejemplos de escenarios y parametrización: `server/tests/auth.test.ts`, `server/tests/projects.test.ts`, `server/tests/tasks.test.ts`.
