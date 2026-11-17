# Refactor de tareas y pruebas de caracterización

| Smell | Dónde estaba | Cambio | Commit |
| --- | --- | --- | --- |
| Método largo con varias responsabilidades | `tasks.service.ts`, `updateTask` | Separó la validación de campos, la resolución del asignado y la autorización de estado. | [ea0a46d](https://github.com/Rodrigo568/taskflow_2026_s2/commit/ea0a46d) |
| Condicionales anidados y decisión de transición repetida | `tasks.service.ts`, ramas de asignación y cambio de estado | Extrajo guard clauses en `resolveAssignee` y `assertCanChangeStatus` y dejó una única llamada a `assertTransition`. | [ea0a46d](https://github.com/Rodrigo568/taskflow_2026_s2/commit/ea0a46d) |
| Entrada cruda mezclada con datos validados | `tasks.service.ts`, `createTask` | Reemplazó el spread por un objeto Prisma tipado con campos permitidos y estado inicial fijo. Es una corrección funcional separada. | [23dece2](https://github.com/Rodrigo568/taskflow_2026_s2/commit/23dece2) |
| Filtros combinados que se descartaban entre sí | `tasks.repository.ts`, `buildFilters` | Acumuló los criterios en un solo filtro. Es una corrección funcional. | [72bb21a](https://github.com/Rodrigo568/taskflow_2026_s2/commit/72bb21a) |
| Consultas repetidas para completar el listado | `tasks.controller.ts`, `listByProject` | Incluyó el asignado en la consulta y agrupó el conteo de comentarios en una sola operación. El commit también corrigió la paginación. | [bf7667c](https://github.com/Rodrigo568/taskflow_2026_s2/commit/bf7667c) |

## Verificación antes y después

La suite [tasks.characterization.test.ts](../server/tests/tasks.characterization.test.ts) se escribió para esta revisión y se ejecutó sin cambios sobre los dos árboles históricos y sobre `main`. Los commits originales conservan su orden. Cada caso tiene una tarea propia.

| Versión | Resultado |
| --- | --- |
| `23dece2`, padre del refactor y posterior al bugfix separado | 5 de 5 pasan |
| `ea0a46d`, refactor | 5 de 5 pasan |
| `main`, revisión de la entrega | 5 de 5 pasan |

Se caracteriza la edición parcial, la validación y limpieza del asignado, las reglas de cambio de estado y el historial, incluida la ausencia de duplicados cuando se repite el mismo estado. Para repetir la comparación, crear dos worktrees en los commits indicados, copiar la suite a `server/tests/`, instalar dependencias y ejecutar `npm --prefix server test -- tasks.characterization.test.ts`. En esta máquina, para los worktrees históricos, se inicializó la plantilla SQLite de Jest con la migración SQL versionada porque el motor de Prisma falló en los checkouts temporales.
