# Contract testing con Pact: TaskFlowWeb → TaskFlowAPI

Contrato entre el frontend (`TaskFlowWeb`, consumer) y la API (`TaskFlowAPI`, provider)
para `GET /api/projects`.

| Pieza | Archivo |
|---|---|
| Test del consumer | `contract-tests/consumer/projects.pact.test.ts` |
| Contrato generado | `pacts/TaskFlowWeb-TaskFlowAPI.json` |
| Verificación del provider | `contract-tests/provider/projects.provider.test.ts` |
| API de test (:3001, base `taskflow_test` + seed) | `contract-tests/start-test-api.mjs` |
| Evidencia (salidas de consola) | `contract-tests/evidencia/` |

El consumer llama al código real del frontend: `getProjects()` de `src/lib/project.ts`,
la misma función que usan `ProjectsPage` y `useProject`.

## Cómo correrlo (desde `client/`)

1. Consumer (genera el contrato en `pacts/`):

   ```bash
   npm run test:contract:consumer
   ```

2. Terminal 1: API de test en :3001. Recrea `server/prisma/taskflow_test.db` (ignorada por git) y carga el seed.

   ```bash
   npm run api:contract
   ```

3. Terminal 2: verificación del provider.

   ```bash
   npm run test:contract:provider
   ```

El provider hace login con `ana@test.com` / `Password1` (usuario del seed) y el
`requestFilter` reemplaza el token falso del contrato por el real. El stateHandler
`el usuario ana tiene proyectos` comprueba que ana tenga proyectos y, si la base
está vacía, le crea uno.

## Qué quedó en el contrato

Solo los campos que `ProjectsPage` lee de cada proyecto: `id`, `name` y `archived`,
con `like(...)` (importa el tipo, no el valor). `description` quedó afuera: la API
puede devolver `null` y la pantalla ya muestra "Sin descripción" en ese caso, así
que el frontend no depende de ella.

## Romper el contrato (parte 4)

1. En `server/src/modules/projects/projects.controller.ts` (`serialize`, que usa `list`)
   se cambió `name: p.name` por `title: p.name`.
2. Se reinició la API y se corrió la verificación: falló con
   `$[0] -> Actual map is missing the following keys: name`.
3. Se revirtió el cambio y la verificación volvió a pasar.

Salidas en `evidencia/`:

- `1-verificacion-ok.txt`: verificación pasando.
- `2-ruptura-name-a-title-falla.txt` y `.png`: verificación fallando con el campo renombrado.
- `3-verificacion-tras-revertir.txt`: verificación pasando otra vez.
- `Semana8.docx`: informe con las capturas de cada paso y las respuestas de la discusión.

## Para discutir

**¿Falló algún test que ya tenían?** Sí: con `title`, 3 tests de la API que miran `name`
en la respuesta (2 de `POST /api/projects` y 1 de `PATCH /api/projects/:projectId`).
Aparte de esos, ya fallaban 4 tests antes del cambio, por bugs previos de la API
(validación de contraseña y de nombre de proyecto). Ningún test miraba `GET /api/projects`
como lo consume el frontend, y el frontend no tiene tests propios.
`tsc` del cliente tampoco se entera: los tipos de `src/types.ts` siguen diciendo `name`.

**¿Quién se enteraba sin Pact? ¿Y cuándo?** Los tests de la API fallaron en este caso
solo porque `serialize` es compartido con `POST` y `PATCH`. Si el cambio hubiera
sido solo en `list`, nadie se enteraba hasta abrir la pantalla de proyectos (en QA o en
producción) y ver las tarjetas sin nombre. Pact lo frena antes del deploy, en el CI.

**¿Qué quedó en el contrato?** Solo `id`, `name` y `archived` (ver arriba).
