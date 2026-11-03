# Pruebas de performance con k6

Práctico de la clase de performance: la misma prueba del listado de tareas con datos chicos y con datos grandes.

## Contenido

| Archivo | Qué es |
|---|---|
| `scenarios/api-load.k6.js` | Script de la clase: `GET /api/projects/:id/tasks` con login en `setup()` y umbrales `p(95)<500` y `rate<0.01`. |
| `scenarios/projects-list.k6.js` | Script complementario: `GET /api/projects`, con un check que exige que la respuesta esté acotada (RNF Rendimiento 1). |
| `../server/prisma/seed-large.ts` | Seed grande: 200 proyectos `[Carga]`, 5.000 tareas y 20.000 comentarios en `[Carga] Proyecto grande`. |
| `results/` | Salida de cada corrida (`.txt` con la salida de k6 y `.json` con `--summary-export`). |

## Cómo correrlo

```bash
npm run db:reset                      # base de desarrollo con la seed chica
npm run dev                           # API en http://localhost:3000/api
k6 run -e VUS=1 -e DURATION=30s performance/scenarios/api-load.k6.js

npm --prefix server run db:seed:large # con la API levantada, sin reiniciar
k6 run -e VUS=20 -e DURATION=1m performance/scenarios/api-load.k6.js
k6 run -e VUS=20 -e DURATION=1m performance/scenarios/projects-list.k6.js
```

Para guardar la evidencia: `--no-color --summary-export performance/results/<nombre>.json` y redirigir la salida a un `.txt`.

## Entorno

- Fecha: 03/11/2026
- Máquina: notebook con AMD Ryzen 7 3700U y 14 GB de RAM, Windows 11 Pro
- Node v24.22.1, k6 v2.3.0, SQLite (`server/prisma/dev.db`), API en modo dev (`ts-node-dev`)
- k6 y la API corren en la misma máquina, así que no hay latencia de red.

## Resultados: listado de tareas (`api-load.k6.js`)

| Anotá | Seed chica (1 VU, 30 s) | Seed grande (20 VUs, 1 min) |
|---|---|---|
| p95 (`http_req_duration`) | **28,67 ms** | **57,32 ms** |
| Error rate (`http_req_failed`) | **0,00 %** (0 de 32) | **0,00 %** (0 de 1.182) |
| Iteraciones por segundo | **0,97 it/s** (30 iteraciones) | **19,42 it/s** (1.180 iteraciones) |
| Checks | 100 % | 100 % |
| Umbrales | ✓ los dos | ✓ los dos |

Archivos: `results/seed-chica-1vu-30s.*` y `results/seed-grande-20vu-1m.*`.

La tabla de la consigna cambia dos variables a la vez: los datos y los usuarios. Para separarlas corrí también el smoke de 1 VU sobre la seed grande:

| Corrida | p95 | Mediana | Bytes por respuesta (aprox.) |
|---|---|---|---|
| Seed chica, 1 VU | 28,67 ms | 14,24 ms | ~2 KB |
| Seed grande, 1 VU | 21,49 ms | 14,37 ms | ~7,4 KB |
| Seed grande, 20 VUs | 57,32 ms | 15,42 ms | ~7,4 KB |

Lectura (primero errores, después percentiles, después throughput):

1. **Errores:** ninguno en las tres corridas, y todos los checks pasan.
2. **p95:** el listado de tareas **cumple el SLO** (RNF Rendimiento 2: p95 ≤ 500 ms con 5.000 tareas y 20.000 comentarios), con mucho margen. Con 1 VU, el volumen de datos casi no cambia la mediana (14,2 → 14,4 ms). El aumento del p95 en la corrida de 20 VUs viene de la concurrencia (20 pedidos compitiendo por un proceso Node y una base SQLite), no del volumen.
3. **Throughput:** las iteraciones por segundo suben porque suben los VUs. Cada iteración dura ~1 s por el `sleep(1)`, así que 20 VUs dan ~20 it/s. No es una mejora del sistema.

Ojo con la muestra chica: con 32 pedidos en la seed chica, el p95 está casi en el máximo. Además, `http_req_duration` incluye el login de `setup()` (bcrypt, ~130–260 ms), que en una muestra de 32 pesa en la cola.

### Hipótesis: qué crece con los datos

En el listado de tareas, **casi nada crece con el volumen**, porque el endpoint ya está bien acotado (`server/src/modules/tasks/tasks.controller.ts`, `tasks.repository.ts`):

- Pagina con `take`/`skip` (20 por defecto, 100 como máximo), así que la respuesta pesa lo mismo con 12 tareas que con 5.000.
- Cuenta los comentarios de la página con **un solo** `groupBy` (no hay N+1), así que la cantidad de consultas no depende de los resultados (RNF Rendimiento 3).
- `tasks.projectId` y `comments.taskId` tienen índice.

Lo único que crece con los datos es el `COUNT(*)` del `total` (recorre las 5.000 filas del proyecto por el índice) y, con `search`, el `LIKE '%…%'`, que no puede usar índice. Medido a mano sobre la seed grande, con `limit=100`, `offset=4900` o `search` sigue por debajo de 30 ms.

## Hallazgo: el listado de proyectos no está paginado

Con la seed grande, `GET /api/projects` devuelve **los 201 proyectos de ana en una sola respuesta (~41,5 KB)** e ignora `limit` y `offset` (`?limit=5` también devuelve 201). Viola el RNF Rendimiento 1 (*ningún endpoint devuelve una colección completa sin límite*). Acá sí, lo que crece con los datos es el tamaño de la respuesta, que es lineal en la cantidad de proyectos del usuario.

| `projects-list.k6.js`, seed grande, 20 VUs, 1 min | Valor |
|---|---|
| p95 | 32,23 ms |
| Error rate | 0,00 % (0 de 1.181) |
| Iteraciones por segundo | 19,52 it/s |
| Check "respuesta acotada (≤ 100 items)" | **✗ 0 de 1.180** |
| Datos recibidos | **49 MB** (contra 9,1 MB del listado de tareas en la misma carga) |

La prueba termina con código ≠ 0 (umbral `checks: rate==1` cruzado). Archivos: `results/proyectos-seed-grande-20vu-1m.*`. El issue está redactado en [`issue-rendimiento.md`](issue-rendimiento.md).
