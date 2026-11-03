# [Performance] GET /api/projects devuelve todos los proyectos sin paginar (201 ítems, ~41 KB por respuesta)

**Etiquetas sugeridas:** `performance`, `bug`

## Criterio violado

Especificación de Requerimientos v1.0, Requerimientos no funcionales, **Rendimiento 1**:

> Todo endpoint de listado devuelve resultados paginados; ningún endpoint devuelve una colección completa sin límite.

Como referencia del contrato de paginación del propio sistema: US-07, criterio 7 (*20 por página por defecto, configurable con `limit` y `offset`, con un `limit` máximo de 100*) y criterio 8 (*la respuesta incluye el total*).

El listado de tareas **cumple** Rendimiento 2 (p95 = 57,32 ms con 5.000 tareas, 20.000 comentarios y 20 VUs). Este issue es solo sobre el listado de proyectos.

## Entorno

- Commit `83f9c1b` (rama `main`)
- Windows 11 Pro, AMD Ryzen 7 3700U, 14 GB de RAM
- Node v24.22.1, API en modo dev (`npm run dev`), SQLite `server/prisma/dev.db`
- k6 v2.3.0, en la misma máquina que la API
- Datos: seed chica + `npm --prefix server run db:seed:large` (200 proyectos `[Carga]`, 5.000 tareas, 20.000 comentarios)

## Pasos para reproducir

1. `npm run db:reset`
2. `npm run dev`
3. `npm --prefix server run db:seed:large`
4. Login como `ana@test.com` / `Password1` y `GET /api/projects?limit=5` con el token.
5. Carga: `k6 run -e VUS=20 -e DURATION=1m performance/scenarios/projects-list.k6.js`

## Esperado vs obtenido

| | Esperado | Obtenido |
|---|---|---|
| Ítems por respuesta sin parámetros | Una página (p. ej. 20, como el listado de tareas) | **201** (todos) |
| Ítems con `?limit=5` | 5 | **201**: `limit` y `offset` se ignoran |
| Máximo por respuesta | Acotado (≤ 100) | Sin límite: crece con la cantidad de proyectos del usuario |
| Formato | `{ items, total, limit, offset }` | Array plano |
| Tamaño de respuesta | Constante respecto al volumen | **~41,5 KB** con 201 proyectos, y sigue creciendo con cada proyecto |

## Evidencia

Salida de k6 (`performance/results/proyectos-seed-grande-20vu-1m.txt`):

```
  █ THRESHOLDS
    checks
    ✗ 'rate==1' rate=50.02%
    http_req_duration
    ✓ 'p(95)<500' p(95)=32.23ms
    http_req_failed
    ✓ 'rate<0.01' rate=0.00%

    ✓ login 200
    ✓ status 200
    ✗ respuesta acotada (<= 100 items)
      ↳  0% — ✓ 0 / ✗ 1180

    http_req_duration..............: avg=17.89ms min=8.15ms med=15.25ms max=126.52ms p(90)=24.16ms p(95)=32.23ms
    iterations.....................: 1180   19.51688/s
    data_received..................: 49 MB  817 kB/s
```

Comparación con el listado de tareas en la misma carga (20 VUs, 1 min, seed grande): **9,1 MB** recibidos contra **49 MB** del listado de proyectos, aunque el proyecto grande tiene 25 veces más tareas (5.000) que proyectos tiene ana (201).

Código: `server/src/modules/projects/projects.controller.ts`, función `list`. El `db.project.findMany` no tiene `take` ni `skip` y la respuesta es `res.json(projects.map(serialize))`.

## Hipótesis

El endpoint trae de la base **todos** los proyectos visibles para el usuario y los serializa uno por uno, así que el costo (filas leídas, objetos serializados, bytes enviados) crece en forma lineal con la cantidad de proyectos. Con 201 proyectos el tiempo sigue bajo (p95 = 32 ms) porque cada fila es chica, pero lo que sí crece es el tamaño de la respuesta (5 veces el tráfico del listado de tareas). Con el volumen de varios años de uso, o con más usuarios concurrentes, ese tiempo también va a crecer. La corrección es paginar igual que `GET /projects/:id/tasks` (`take`/`skip` con `limit` por defecto 20 y máximo 100, más `total` con un `count`). Como cambia el contrato (array a `{ items, total }`), hay que actualizar el cliente y el Pact de proyectos.

**Relacionado (mismo criterio):** `GET /api/tasks/:id/comments` (`comments.repository.ts`, `listByTask`) tampoco pagina. Con 4 comentarios por tarea no se nota, pero tampoco tiene límite.
