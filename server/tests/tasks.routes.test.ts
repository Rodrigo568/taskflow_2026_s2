import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Rutas de detalle de tareas y membresía', () => {
  let token: string;
  let taskId: string;

  beforeAll(async () => {
    ({ token } = await registerUser('task-routes-owner@test.com'));
    const project = await createProject(token, 'Proyecto para rutas de tareas');
    taskId = (await createTask(token, project.id, { title: 'Tarea con etiquetas' })).id;
  });

  it.each(['proj-1', 'task-999999'])('devuelve 404 para la tarea %s', async id => {
    const res = await request(app).get(`/api/tasks/${id}`).set(auth(token)).expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rechaza consultar el detalle a quien no integra el proyecto', async () => {
    const { token: otherToken } = await registerUser('task-routes-other@test.com');
    const res = await request(app).get(`/api/tasks/${taskId}`).set(auth(otherToken)).expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body).not.toHaveProperty('title');
  });

  it('agrega, lista y elimina una etiqueta de una tarea propia', async () => {
    const path = `/api/tasks/${taskId}`;
    const created = await request(app).post(`${path}/tags`).set(auth(token)).send({ name: 'backend' }).expect(201);
    expect(created.body).toMatchObject({ name: 'backend', id: expect.stringMatching(/^tag-\d+$/) });

    const tagged = await request(app).get(path).set(auth(token)).expect(200);
    expect(tagged.body.tags).toEqual([created.body]);

    await request(app).delete(`${path}/tags/${created.body.id}`).set(auth(token)).expect(204);
    const untagged = await request(app).get(path).set(auth(token)).expect(200);
    expect(untagged.body.tags).toEqual([]);
  });
});
