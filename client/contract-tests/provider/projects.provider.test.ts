import path from 'path';
import { Verifier } from '@pact-foundation/pact';
import { describe, it } from 'vitest';

// API de test levantada aparte (ver contract-tests/README.md).
const providerBaseUrl = process.env.PROVIDER_BASE_URL ?? 'http://localhost:3001';

async function login(): Promise<string> {
  const res = await fetch(`${providerBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@test.com', password: 'Password1' }),
  });
  if (!res.ok) throw new Error(`Login de ana falló con ${res.status}: ¿está la API en ${providerBaseUrl} con el seed?`);
  const { token } = await res.json();
  return token;
}

describe('TaskFlowAPI cumple el contrato con TaskFlowWeb', () => {
  it('verifica pacts/TaskFlowWeb-TaskFlowAPI.json', async () => {
    const token = await login();
    const authHeaders = { Authorization: `Bearer ${token}` };

    await new Verifier({
      provider: 'TaskFlowAPI',
      providerBaseUrl,
      pactUrls: [path.resolve(process.cwd(), 'pacts/TaskFlowWeb-TaskFlowAPI.json')],
      // El contrato trae un token falso; lo cambiamos por el de ana.
      requestFilter: (req, _res, next) => {
        req.headers['authorization'] = `Bearer ${token}`;
        next();
      },
      stateHandlers: {
        // El seed ya le da proyectos a ana; si la base no los tiene, se crea uno.
        'el usuario ana tiene proyectos': async () => {
          const res = await fetch(`${providerBaseUrl}/api/projects`, { headers: authHeaders });
          const projects: unknown[] = await res.json();
          if (projects.length > 0) return;

          await fetch(`${providerBaseUrl}/api/projects`, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Proyecto del contrato' }),
          });
        },
      },
      logLevel: 'error',
    }).verifyProvider();
  }, 30000);
});
