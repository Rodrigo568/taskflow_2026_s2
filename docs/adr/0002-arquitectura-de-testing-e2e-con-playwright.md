# ADR-002: Arquitectura de testing end-to-end con Playwright

- **Estado:** Aceptado
- **Fecha:** 2026-09-24
- **Alcance:** pruebas end-to-end del frontend (`e2e/`)

## Contexto

El ADR-001 registra las pruebas del backend, que ejercitan la API por HTTP pero no el navegador. Faltaba evidencia de que la interfaz muestra y modifica los datos correctamente. El stack para cubrir ese hueco ya está decidido: Playwright con TypeScript. Este ADR registra qué patrones usa el framework, dónde aparecen y por qué convienen.

La interfaz ya expone `data-testid` en sus elementos. Tres piezas se repiten dentro de su pantalla y hoy están escritas inline en el JSX, sin extraer como componente reutilizable:

| Pantalla | Pieza repetida | Ubicación |
| --- | --- | --- |
| Tablero de tareas | `task-card`, en las 3 columnas | `client/src/pages/BoardPage.tsx` |
| Detalle de tarea | `comment-item`, en la lista de comentarios | `client/src/pages/TaskDetailPage.tsx` |
| Miembros | `member-item`, en la lista de miembros | `client/src/pages/MembersPage.tsx` |

## Decisión registrada

Las pruebas e2e viven en `e2e/` y se configuran en `playwright.config.ts`. Se corren con `npm run test:e2e`. Playwright levanta sus propios servidores: una API en el puerto 3100 con una base SQLite exclusiva (`server/prisma/e2e.db`, que se recrea en cada corrida) y el frontend de Vite en el puerto 5174, con el proxy apuntando a esa API. Así no se mezclan con `npm run dev` ni con la base de desarrollo.

| Patrón | Dónde aparece | Uso en TaskFlow |
| --- | --- | --- |
| Component Object | `e2e/components/TaskCard.ts` | Encapsula una tarjeta de tarea: sus datos (título, prioridad, responsable, vencimiento, comentarios, estado) y sus acciones (`changeStatus`, `open`). Recibe el `Locator` raíz de una tarjeta y busca todo dentro de él. |
| Page Object | `e2e/pages/BoardPage.ts` | Representa la pantalla del tablero: navegación, columnas, contador y total. Compone el Component Object: `card(title, status?)` devuelve un `TaskCard`. |
| Fixtures de Playwright | `e2e/fixtures.ts` | Inyecta en cada test `api`, `session` (usuario nuevo con la sesión cargada en `localStorage`) y `boardPage`. Los tests declaran lo que necesitan en sus parámetros. |
| Preparación de datos por API | `e2e/support/api.ts` (`TaskflowApi`) | Crea usuarios, proyectos, tareas, estados y comentarios con solicitudes HTTP. El navegador solo recorre lo que el test verifica. |
| Localizadores por `data-testid` | `testIdAttribute` en la configuración; `getByTestId` en componentes y páginas | Los selectores no dependen de clases CSS ni de textos visibles que pueden cambiar. |
| Datos únicos por test | `uniqueEmail()` y fixture `session` | Cada test registra su propio usuario y proyecto, así pueden correr en paralelo (`fullyParallel`) sin compartir estado. |
| Arrange–Act–Assert | `e2e/tests/board.spec.ts` | Cada test prepara datos por API, actúa en la UI a través de los objetos y verifica con aserciones web-first (`expect(locator)`), que reintentan hasta que la UI se actualiza. |

## Por qué esta pieza: `task-card` y no el tablero entero

Se eligió el tablero y su tarjeta como primera pieza. Los criterios que la justifican:

| Criterio | `task-card` como Component Object | Encapsular la pantalla entera |
| --- | --- | --- |
| Repetición | La misma estructura aparece N veces en las 3 columnas. Una sola clase describe todas las instancias. | Obligaría a métodos por columna o por posición (`primeraTarjetaDeTodo()`, etc.) y duplicaría la lógica de la tarjeta. |
| Cohesión | La tarjeta tiene datos y comportamiento propios: muestra 5 campos y permite cambiar el estado o abrir el detalle. | El tablero también tiene formulario de creación, filtros y total. Una sola clase mezclaría responsabilidades que cambian por motivos distintos. |
| Aislamiento de locators | Todo se busca dentro del `root` de la tarjeta. `task-card-priority` no se confunde con el de otra tarjeta. | Con locators de página, `getByTestId('task-card-priority')` coincide con todas las tarjetas a la vez. |
| Mantenibilidad | Si cambia el markup de la tarjeta, se corrige en `TaskCard.ts` y todos los tests siguen iguales. | El cambio impacta en un objeto grande que también se toca por los filtros o la creación. |
| Reutilización | Cuando la tarjeta aparezca en otra vista (por ejemplo, un listado filtrado), la clase sirve sin cambios porque solo depende de su raíz. | La clase de una pantalla no se puede reutilizar fuera de esa pantalla. |

La pantalla igual tiene su Page Object (`BoardPage`), pero es delgado: sabe navegar y encontrar columnas y tarjetas, y delega el detalle en `TaskCard`. Es la composición recomendada: **Page Object para la pantalla, Component Object para la pieza repetida**.

Se priorizó `task-card` sobre `comment-item` y `member-item` porque es la pieza con más datos y la única con una acción que cambia el estado de la aplicación: al cambiar el estado, la tarjeta se mueve de columna. Las otras dos se modelan igual (`CommentItem`, `MemberItem` con su Page Object) cuando se cubran esas pantallas.

## Por qué convienen estos patrones

| Criterio | Relación con el patrón | Límite observado |
| --- | --- | --- |
| Fidelidad al comportamiento | Los tests corren en Chromium contra la app real (Vite + API + SQLite). Verifican lo que ve el usuario, incluido que la tarjeta cambie de columna. | Solo se configura Chromium. No se prueban Firefox ni WebKit. |
| Aislamiento y repetibilidad | Base propia recreada en cada corrida, y un usuario y proyecto nuevos por test. Los tests no dependen del orden. | La base se comparte entre los tests de una corrida. El aislamiento se logra con datos únicos, igual que en el backend (ADR-001). |
| Rapidez | Preparar datos por API evita recorrer formularios. La sesión se inyecta en `localStorage` en vez de pasar por el login. La suite actual corre en unos 20 s con 4 workers. | Levantar los dos servidores agrega tiempo fijo al inicio. |
| Mantenibilidad | Los tests hablan en términos del dominio (`card('X').changeStatus('DONE')`). Los locators están en un solo lugar. | Hay más archivos que en un test lineal. El beneficio aparece cuando crecen los tests. |
| Diagnóstico de fallas | Traza y screenshot se guardan solo cuando un test falla. Los nombres de los tests describen el comportamiento. | — |

## Consecuencias

- Hay evidencia automatizada del frontend, que el ADR-001 marcaba como faltante.
- El framework encontró un defecto: el vencimiento de una tarea se muestra un día antes en zonas UTC-. La API guarda la fecha como medianoche UTC (`parseDueDate`) y la formatea en hora local (`formatDueDate`, en `server/src/lib/ids.ts`). El test `muestra la fecha de vencimiento cargada` lo documenta con `test.fail()`: la suite queda en verde mientras el defecto exista y avisa cuando se corrija.
- Se modificó `client/vite.config.ts` para que el destino del proxy se pueda configurar (`VITE_API_PROXY`). El valor por defecto sigue siendo `http://localhost:3000`, así que `npm run dev` funciona igual.
- La primera vez hay que descargar el navegador: `npx playwright install chromium`.

## Pendiente

- Component Objects de `comment-item` (Detalle de tarea) y `member-item` (Miembros), cada uno con su Page Object.
- Page Objects de login y proyectos, cuando se cubran esos flujos por la UI.

## Referencias del repositorio

- Configuración: `playwright.config.ts`, `e2e/support/env.ts`, `e2e/support/fresh-db.cjs`.
- Component Object: `e2e/components/TaskCard.ts`.
- Page Object: `e2e/pages/BoardPage.ts`.
- Fixtures y datos: `e2e/fixtures.ts`, `e2e/support/api.ts`.
- Tests: `e2e/tests/board.spec.ts`.
