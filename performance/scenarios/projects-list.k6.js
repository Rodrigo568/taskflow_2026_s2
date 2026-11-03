// Prueba de carga del listado de proyectos de TaskFlow (GET /api/projects).
//
// Complementa api-load.k6.js: este endpoint no está paginado, así que el tamaño de la
// respuesta crece con la cantidad de proyectos del usuario (RNF Rendimiento 1).
//
// Parámetros (variables de entorno, se pasan con -e):
//   VUS       usuarios virtuales (por defecto 1)
//   DURATION  duración (por defecto 30s)
//   BASE_URL  URL de la API, con prefijo /api (por defecto http://localhost:3000/api)
//
// Ejemplo:
//   k6 run -e VUS=20 -e DURATION=1m performance/scenarios/projects-list.k6.js

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000/api';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Un listado paginado no debería devolver más que esto en una sola respuesta
// (mismo límite máximo que el listado de tareas, US-07 criterio 7).
const MAX_PAGE_SIZE = 100;

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate==1'],
  },
};

// Login una sola vez (la cuenta se bloquea tras varios intentos fallidos).
export function setup() {
  const login = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: 'ana@test.com', password: 'Password1' }),
    { headers: JSON_HEADERS }
  );
  check(login, { 'login 200': (r) => r.status === 200 });
  const body = login.json();
  return { headers: { Authorization: `Bearer ${body.token || body.accessToken}` } };
}

export default function (data) {
  const res = http.get(`${BASE}/projects?limit=20`, { headers: data.headers });
  check(res, {
    'status 200': (r) => r.status === 200,
    [`respuesta acotada (<= ${MAX_PAGE_SIZE} items)`]: (r) => {
      const body = r.json();
      const items = Array.isArray(body) ? body : body.items;
      return Array.isArray(items) && items.length <= MAX_PAGE_SIZE;
    },
  });
  sleep(1);
}
