import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('US-16: fecha de vencimiento', () => {
  let token: string;
  let taskId: string;

  beforeAll(async () => {
    ({ token } = await registerUser('us16-owner@test.com'));
    const project = await createProject(token, 'US-16 fechas');
    taskId = (await createTask(token, project.id, { title: 'Tarea con fecha' })).id;
  });

  it('permite una tarea sin fecha y devuelve null (CA-4)', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBeNull();
  });

  it('guarda y devuelve el mismo día calendario ISO (CA-1, CA-2, CA-3)', async () => {
    const changed = await request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send({ dueDate: '2026-09-15' });
    expect(changed.status).toBe(200);
    expect(changed.body.dueDate).toBe('2026-09-15');
    const read = await request(app).get(`/api/tasks/${taskId}`).set(auth(token));
    expect(read.status).toBe(200);
    expect(read.body.dueDate).toBe('2026-09-15');
  });

  it('quita la fecha enviando null (CA-5)', async () => {
    const assigned = await request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send({ dueDate: '2026-09-15' });
    expect(assigned.status).toBe(200);
    expect(assigned.body.dueDate).not.toBeNull();
    const res = await request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send({ dueDate: null });
    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBeNull();
    const read = await request(app).get(`/api/tasks/${taskId}`).set(auth(token));
    expect(read.status).toBe(200);
    expect(read.body.dueDate).toBeNull();
  });

  it('rechaza el formato inválido con 400 (CA-6)', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send({ dueDate: '15/09/2026' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('acepta una fecha pasada (CA-7)', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send({ dueDate: '2020-01-01' });
    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBe('2020-01-01');
  });

  it('impide a un no miembro modificar la fecha (CA-8)', async () => {
    const outsider = await registerUser('us16-outsider@test.com');
    const res = await request(app).patch(`/api/tasks/${taskId}`).set(auth(outsider.token)).send({ dueDate: '2027-01-01' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rechaza una fecha imposible aunque siga el formato ISO (CA-1, CA-6)', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send({ dueDate: '2026-02-30' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza actualizar la fecha sin autenticación (regla general)', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`).send({ dueDate: '2026-09-15' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
