import request from 'supertest';
import { app, auth, createProject, registerUser } from './helpers';

describe('Proyectos: edición y borrado', () => {
  describe('PATCH /api/projects/:projectId', () => {
    it('actualiza el nombre y la descripción y devuelve el proyecto actualizado', async () => {
      const { token, id: ownerId } = await registerUser('proyecto-edicion@test.com');
      const project = await createProject(token, 'Nombre original');

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set(auth(token))
        .send({ name: '  Nombre nuevo  ', description: '  Descripción nueva  ' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: project.id,
        name: 'Nombre nuevo',
        description: 'Descripción nueva',
        ownerId,
        archived: false,
      });
      expect(res.body.createdAt).toEqual(expect.any(String));
    });

    it.each([
      ['un identificador inválido', 'no-es-un-proyecto'],
      ['un proyecto inexistente', 'proj-999999'],
    ])('responde 404 al editar %s', async (_scenario, projectId) => {
      const { token } = await registerUser(`editar-no-encontrado-${Date.now()}@test.com`);

      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set(auth(token))
        .send({ name: 'Nombre nuevo' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Project not found' });
    });

    it('oculta un proyecto de otro usuario que no es miembro', async () => {
      const owner = await registerUser('proyecto-privado-owner@test.com');
      const outsider = await registerUser('proyecto-privado-outsider@test.com');
      const project = await createProject(owner.token, 'Proyecto privado');

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set(auth(outsider.token))
        .send({ name: 'Nombre ajeno' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rechaza cambios de un miembro que no es owner', async () => {
      const owner = await registerUser('proyecto-miembro-owner@test.com');
      const member = await registerUser('proyecto-miembro-editor@test.com');
      const project = await createProject(owner.token, 'Proyecto compartido');
      await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner.token))
        .send({ email: 'proyecto-miembro-editor@test.com' });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set(auth(member.token))
        .send({ name: 'Nombre ajeno' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Only the project owner can edit it',
      });
    });

    it.each([
      ['un nombre demasiado corto', { name: 'ab' }],
      ['un nombre que no es texto', { name: 42 }],
      ['una descripción que no es texto', { description: 42 }],
    ])('rechaza editar con %s y devuelve el error de validación', async (_scenario, body) => {
      const { token } = await registerUser(`proyecto-edicion-invalida-${Date.now()}@test.com`);
      const project = await createProject(token, 'Proyecto válido');

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set(auth(token))
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza renombrar un proyecto con el nombre de otro proyecto del mismo owner', async () => {
      const { token } = await registerUser('proyecto-edicion-duplicado@test.com');
      await createProject(token, 'Nombre ocupado');
      const project = await createProject(token, 'Nombre disponible');

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set(auth(token))
        .send({ name: 'Nombre ocupado' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({
        code: 'CONFLICT',
        message: 'You already have a project with that name',
      });
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    it('elimina el proyecto del owner y devuelve cuerpo vacío', async () => {
      const { token } = await registerUser('proyecto-borrado@test.com');
      const project = await createProject(token, 'Proyecto para borrar');

      const res = await request(app).delete(`/api/projects/${project.id}`).set(auth(token));
      const list = await request(app).get('/api/projects').set(auth(token));

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
      expect(list.status).toBe(200);
      expect(list.body).toEqual([]);
    });

    it('impide que un miembro elimine un proyecto', async () => {
      const owner = await registerUser('proyecto-borrado-owner@test.com');
      const member = await registerUser('proyecto-borrado-member@test.com');
      const project = await createProject(owner.token, 'Proyecto ajeno');
      await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner.token))
        .send({ email: 'proyecto-borrado-member@test.com' });

      const res = await request(app).delete(`/api/projects/${project.id}`).set(auth(member.token));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Only the project owner can delete it',
      });
    });
  });
});
