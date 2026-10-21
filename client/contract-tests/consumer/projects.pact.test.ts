import path from 'path';
import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import { describe, expect, it } from 'vitest';
import { getProjects } from '../../src/lib/project';

const { like, eachLike } = MatchersV3;

const pact = new PactV3({
  consumer: 'TaskFlowWeb',
  provider: 'TaskFlowAPI',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'error',
});

describe('Contrato TaskFlowWeb -> TaskFlowAPI', () => {
  it('GET /api/projects devuelve los proyectos del usuario', async () => {
    pact
      .given('el usuario ana tiene proyectos')
      .uponReceiving('un GET a /api/projects')
      .withRequest({
        method: 'GET',
        path: '/api/projects',
        headers: {
          Authorization: like('Bearer token-de-prueba'),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        // Solo lo que ProjectsPage lee de cada proyecto. description no entra:
        // puede ser null y la pantalla ya muestra "Sin descripción" en ese caso.
        body: eachLike({
          id: like('proj-1'),
          name: like('Rediseño del sitio'),
          archived: like(false),
        }),
      });

    await pact.executeTest(async (mockServer) => {
      const projects = await getProjects(
        mockServer.url, // la API falsa de Pact
        'token-de-prueba',
      );

      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toEqual({ id: 'proj-1', name: 'Rediseño del sitio', archived: false });
    });
  });
});
