import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

async function createTaskCatalog(suffix: string) {
  const safeSuffix = suffix.replaceAll(' ', '-');
  const { token } = await registerUser(`filtros-${safeSuffix}-${Date.now()}@test.com`);
  const project = await createProject(token, `Proyecto filtros ${suffix}`);
  const todoHigh = await createTask(token, project.id, {
    title: 'Preparar informe prioritario',
    priority: 'HIGH',
  });
  const todoLow = await createTask(token, project.id, {
    title: 'Revisar documentación',
    priority: 'LOW',
  });
  const progressHigh = await createTask(token, project.id, {
    title: 'Implementar búsqueda',
    priority: 'HIGH',
  });

  await request(app)
    .patch(`/api/tasks/${progressHigh.id}`)
    .set(auth(token))
    .send({ status: 'IN_PROGRESS' });

  return { token, project, todoHigh, todoLow, progressHigh };
}

describe('Tareas', () => {
  it('crea una tarea en un proyecto', async () => {
    const { token } = await registerUser('task1@test.com');
    const project = await createProject(token, 'Proyecto de tareas');

    const res = await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set(auth(token))
      .send({ title: 'Implementar login', priority: 'HIGH' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TODO');
  });

  it('avanza una tarea de TODO a IN_PROGRESS', async () => {
    const { token, id } = await registerUser('task2@test.com');
    const project = await createProject(token, 'Proyecto de estados');
    const task = (
      await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set(auth(token))
        .send({ title: 'Tarea con estados', assigneeId: id })
    ).body;

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set(auth(token))
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('filtra las tareas por estado', async () => {
    const { token } = await registerUser('task3@test.com');
    const project = await createProject(token, 'Proyecto de filtros');
    await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set(auth(token))
      .send({ title: 'Primera tarea' });
    await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set(auth(token))
      .send({ title: 'Segunda tarea' });

    const res = await request(app)
      .get(`/api/projects/${project.id}/tasks?status=TODO`)
      .set(auth(token));

    expect(res.body.items).toHaveLength(2);
  });

  describe('GET /api/projects/:projectId/tasks', () => {
    it('requiere autenticación', async () => {
      const res = await request(app).get('/api/projects/proj-1/tasks');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rechaza a un usuario que no pertenece al proyecto', async () => {
      const owner = await registerUser(`owner-filtros-${Date.now()}@test.com`);
      const outsider = await registerUser(`outsider-filtros-${Date.now()}@test.com`);
      const project = await createProject(owner.token, 'Proyecto privado');

      const res = await request(app).get(`/api/projects/${project.id}/tasks`).set(auth(outsider.token));

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('informa un proyecto inexistente', async () => {
      const { token } = await registerUser(`proyecto-inexistente-${Date.now()}@test.com`);

      const res = await request(app).get('/api/projects/proj-999999/tasks').set(auth(token));

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('devuelve todas las tareas cuando no recibe filtros', async () => {
      const { token, project } = await createTaskCatalog('sin-filtros');

      const res = await request(app).get(`/api/projects/${project.id}/tasks`).set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.items).toHaveLength(3);
    });

    it.each([
      ['estado', { status: 'TODO' }, ['Preparar informe prioritario', 'Revisar documentación']],
      ['prioridad', { priority: 'HIGH' }, ['Preparar informe prioritario', 'Implementar búsqueda']],
      ['estado y prioridad', { status: 'TODO', priority: 'HIGH' }, ['Preparar informe prioritario']],
    ])('aplica filtros por %s', async (testId, filters, expectedTitles) => {
      const { token, project } = await createTaskCatalog(testId);

      const res = await request(app)
        .get(`/api/projects/${project.id}/tasks`)
        .query(filters)
        .set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body.items.map((task: { title: string }) => task.title)).toEqual(expectedTitles);
      expect(res.body.total).toBe(expectedTitles.length);
    });

    it('busca texto en el título de la tarea', async () => {
      const { token, project } = await createTaskCatalog('busqueda');

      const res = await request(app)
        .get(`/api/projects/${project.id}/tasks`)
        .query({ search: 'búsqueda' })
        .set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body.items.map((task: { title: string }) => task.title)).toEqual(['Implementar búsqueda']);
    });

    it('pagina los resultados sin alterar el total filtrado', async () => {
      const { token, project, todoLow } = await createTaskCatalog('paginacion');

      const res = await request(app)
        .get(`/api/projects/${project.id}/tasks`)
        .query({ limit: 1, offset: 1 })
        .set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 3, limit: 1, offset: 1 });
      expect(res.body.items).toEqual([expect.objectContaining({ id: todoLow.id })]);
    });
  });
});
