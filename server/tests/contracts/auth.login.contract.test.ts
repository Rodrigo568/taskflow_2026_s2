import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { MatchersV3, PactV4, SpecificationVersion, Verifier } from '@pact-foundation/pact';
import { AddressInfo } from 'net';
import { db } from '../../src/lib/db';
import { app } from '../helpers';

const pactDirectory = path.resolve(__dirname, '../../pacts');
const pactFile = path.join(pactDirectory, 'TaskFlowLoginClient-TaskFlowAPI.json');
const providerState = 'Ana has a registered account with valid credentials';
const loginExample = { email: 'ana@test.com', password: 'Password1' };

const consumerContract = new PactV4({
  consumer: 'TaskFlowLoginClient',
  provider: 'TaskFlowAPI',
  dir: pactDirectory,
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  logLevel: 'error',
});

describe('Contrato de login entre TaskFlowLoginClient y TaskFlowAPI', () => {
  it('define POST /api/auth/login y espera un token y un usuario', async () => {
    await consumerContract
      .addInteraction()
      .given(providerState)
      .uponReceiving('a login request with valid credentials')
      .withRequest('POST', '/api/auth/login', (builder) => {
        builder.headers({ 'Content-Type': 'application/json' });
        builder.jsonBody(loginExample);
      })
      .willRespondWith(200, (builder) => {
        builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
        builder.jsonBody({
          token: MatchersV3.string('token-example'),
          user: {
            id: MatchersV3.string('user_1'),
            email: 'ana@test.com',
            name: MatchersV3.nullValue(),
            createdAt: MatchersV3.timestamp(
              "yyyy-MM-dd'T'HH:mm:ss.SSSX",
              '2026-10-20T00:00:00.000Z',
            ),
          },
        });
      })
      .executeTest(async ({ url }) => {
        const response = await fetch(`${url}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginExample),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
          token: 'token-example',
          user: {
            id: 'user_1',
            email: 'ana@test.com',
            name: null,
            createdAt: '2026-10-20T00:00:00.000Z',
          },
        });
      });

    expect(fs.existsSync(pactFile)).toBe(true);
  });

  it('verifica el contrato contra la API y prepara el estado del proveedor', async () => {
    const providerServer = app.listen(0);

    try {
      await new Promise<void>((resolve, reject) => {
        providerServer.once('listening', resolve);
        providerServer.once('error', reject);
      });

      const address = providerServer.address() as AddressInfo;
      const providerBaseUrl = `http://127.0.0.1:${address.port}`;

      await new Verifier({
        provider: 'TaskFlowAPI',
        providerBaseUrl,
        pactUrls: [process.env.PACT_FILE ?? pactFile],
        stateHandlers: {
          [providerState]: async () => {
            await db.user.upsert({
              where: { email: loginExample.email },
              update: {
                passwordHash: await bcrypt.hash(loginExample.password, 10),
                failedAttempts: 0,
                lockedUntil: null,
                name: null,
              },
              create: {
                email: loginExample.email,
                passwordHash: await bcrypt.hash(loginExample.password, 10),
              },
            });
          },
        },
        logLevel: 'error',
      }).verifyProvider();
    } finally {
      await new Promise<void>((resolve, reject) => {
        providerServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
