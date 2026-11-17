import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Caracterización de PATCH /api/tasks/:id', () => {
  let owner: Awaited<ReturnType<typeof registerUser>>;
  let member: Awaited<ReturnType<typeof registerUser>>;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    owner = await registerUser('characterization-owner@test.com');
    member = await registerUser('characterization-member@test.com');
    projectId = (await createProject(owner.token, 'Proyecto caracterización')).id;
    await request(app).post(`/api/projects/${projectId}/members`).set(auth(owner.token))
      .send({ email: 'characterization-member@test.com' }).expect(201);
  });

  beforeEach(async () => {
    taskId = (await createTask(owner.token, projectId, { title: 'Tarea base', assigneeId: member.id })).id;
  });

  function patch(token: string, changes: Record<string, unknown>) {
    return request(app).patch(`/api/tasks/${taskId}`).set(auth(token)).send(changes);
  }

  function history() {
    return request(app).get(`/api/tasks/${taskId}/history`).set(auth(owner.token)).expect(200);
  }

  it('aplica cambios parciales y conserva los campos omitidos', async () => {
    const res = await patch(owner.token, { title: '  Título editado  ', priority: 'HIGH' }).expect(200);
    expect(res.body).toMatchObject({ title: 'Título editado', priority: 'HIGH', assigneeId: member.id, status: 'TODO' });
    expect((await history()).body).toHaveLength(1);
  });

  it('rechaza un asignado inválido y admite quitar la asignación', async () => {
    const invalid = await patch(owner.token, { assigneeId: 'proj-1' }).expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    const cleared = await patch(owner.token, { assigneeId: null }).expect(200);
    expect(cleared.body.assigneeId).toBeNull();
  });

  it('registra la transición del asignado una sola vez', async () => {
    await patch(member.token, { status: 'IN_PROGRESS' }).expect(200);
    await patch(member.token, { status: 'IN_PROGRESS' }).expect(200);
    expect((await history()).body).toEqual([
      expect.objectContaining({ fromStatus: null, toStatus: 'TODO' }),
      expect.objectContaining({ fromStatus: 'TODO', toStatus: 'IN_PROGRESS', changedBy: member.id }),
    ]);
  });

  it('rechaza que un miembro sin asignar ni rol de administración cambie el estado', async () => {
    await patch(owner.token, { assigneeId: null }).expect(200);
    const denied = await patch(member.token, { status: 'IN_PROGRESS' }).expect(403);
    expect(denied.body.error.code).toBe('FORBIDDEN');
    expect((await history()).body).toHaveLength(1);
  });

  it('rechaza reabrir una tarea terminada y conserva su historial', async () => {
    await patch(owner.token, { status: 'IN_PROGRESS' }).expect(200);
    await patch(owner.token, { status: 'DONE' }).expect(200);
    const invalid = await patch(owner.token, { status: 'TODO' }).expect(422);
    expect(invalid.body.error.code).toBe('INVALID_TRANSITION');
    expect((await history()).body.map((entry: { toStatus: string }) => entry.toStatus))
      .toEqual(['TODO', 'IN_PROGRESS', 'DONE']);
  });
});
