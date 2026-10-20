import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { MatchersV3, PactV4, SpecificationVersion, Verifier } from '@pact-foundation/pact';
import { AddressInfo } from 'net';
import { db } from '../../src/lib/db';
import { signToken } from '../../src/middleware/auth';
import { app } from '../helpers';

const pactDirectory = path.resolve(__dirname, '../../pacts');
const pactFile = path.join(pactDirectory, 'TaskFlowCommentsClient-TaskFlowAPI.json');
const providerState = 'task-1 exists and has comments visible to Ana';
const commentsPath = '/api/tasks/task-1/comments';
const exampleToken = 'Bearer token-example';

const consumerContract = new PactV4({
  consumer: 'TaskFlowCommentsClient',
  provider: 'TaskFlowAPI',
  dir: pactDirectory,
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  logLevel: 'error',
});

describe('Contrato de comentarios entre TaskFlowCommentsClient y TaskFlowAPI', () => {
  it('define GET /api/tasks/task-1/comments y espera una lista de comentarios', async () => {
    await consumerContract
      .addInteraction()
      .given(providerState)
      .uponReceiving('a request for the comments of task-1')
      .withRequest('GET', commentsPath, (builder) => {
        builder.headers({ Authorization: MatchersV3.regex(/^Bearer .+$/, exampleToken) });
      })
      .willRespondWith(200, (builder) => {
        builder.headers({ 'Content-Type': 'application/json; charset=utf-8' });
        builder.jsonBody(
          MatchersV3.eachLike({
            id: MatchersV3.regex(/^comment-\d+$/, 'comment-1'),
            taskId: MatchersV3.regex(/^task-1$/, 'task-1'),
            body: MatchersV3.string('Primer comentario'),
            createdAt: MatchersV3.timestamp(
              "yyyy-MM-dd'T'HH:mm:ss.SSSX",
              '2026-10-20T00:00:00.000Z',
            ),
          }),
        );
      })
      .executeTest(async ({ url }) => {
        const response = await fetch(`${url}${commentsPath}`, {
          headers: { Authorization: exampleToken },
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual([
          {
            id: 'comment-1',
            taskId: 'task-1',
            body: 'Primer comentario',
            createdAt: '2026-10-20T00:00:00.000Z',
          },
        ]);
      });

    expect(fs.existsSync(pactFile)).toBe(true);
  });

  it('verifica el contrato contra la API y prepara la tarea con sus comentarios', async () => {
    const providerServer = app.listen(0);
    // El contrato lleva un token de ejemplo; el filtro lo reemplaza por uno válido de Ana.
    let authorization: string | undefined;

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
        requestFilter: (req, _res, next) => {
          if (authorization) req.headers.authorization = authorization;
          next();
        },
        stateHandlers: {
          [providerState]: async () => {
            const ana = await db.user.upsert({
              where: { email: 'ana@test.com' },
              update: {},
              create: {
                email: 'ana@test.com',
                passwordHash: await bcrypt.hash('Password1', 10),
              },
            });
            await db.project.upsert({
              where: { id: 1 },
              update: { ownerId: ana.id, archived: false },
              create: { id: 1, name: 'Proyecto del contrato', ownerId: ana.id },
            });
            await db.projectMember.upsert({
              where: { projectId_userId: { projectId: 1, userId: ana.id } },
              update: { role: 'OWNER' },
              create: { projectId: 1, userId: ana.id, role: 'OWNER' },
            });
            await db.task.upsert({
              where: { id: 1 },
              update: { projectId: 1 },
              create: { id: 1, projectId: 1, title: 'Tarea con comentarios' },
            });
            await db.comment.deleteMany({ where: { taskId: 1 } });
            await db.comment.createMany({
              data: [
                { taskId: 1, authorId: ana.id, body: 'Primer comentario' },
                { taskId: 1, authorId: ana.id, body: 'Segundo comentario' },
              ],
            });

            authorization = `Bearer ${signToken({ userId: ana.id, email: ana.email })}`;
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
