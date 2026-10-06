import request from 'supertest';
import { app, auth, createProject, registerUser } from './helpers';

describe('Proyectos: gestión de miembros', () => {
  describe('POST /api/projects/:projectId/members', () => {
    it('agrega un usuario por email y devuelve sus datos de membresía', async () => {
      const owner = await registerUser('miembros-owner@test.com');
      const member = await registerUser('miembros-nuevo@test.com');
      const project = await createProject(owner.token, 'Proyecto con miembros');

      const res = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner.token))
        .send({ email: '  MIEMBROS-NUEVO@TEST.COM  ' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        projectId: project.id,
        userId: member.id,
        email: 'miembros-nuevo@test.com',
        role: 'MEMBER',
      });
    });

    it.each([
      ['un formato de email inválido', { email: 'no-es-email' }, 400, 'VALIDATION_ERROR'],
      ['un usuario inexistente', { email: 'nadie@test.com' }, 404, 'NOT_FOUND'],
      ['un email ausente', {}, 400, 'VALIDATION_ERROR'],
    ])('rechaza agregar un miembro con %s', async (_scenario, body, status, code) => {
      const { token } = await registerUser(`miembro-invalido-${Date.now()}@test.com`);
      const project = await createProject(token, 'Proyecto de membresía');

      const res = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(token))
        .send(body);

      expect(res.status).toBe(status);
      expect(res.body.error.code).toBe(code);
    });

    it('rechaza que alguien que no es owner gestione miembros', async () => {
      const owner = await registerUser('miembros-protegidos-owner@test.com');
      const outsider = await registerUser('miembros-protegidos-outsider@test.com');
      const project = await createProject(owner.token, 'Proyecto protegido');

      const res = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(outsider.token))
        .send({ email: outsider.res.body.user.email });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Only the project owner can manage members',
      });
    });

    it('rechaza agregar a un usuario que ya es miembro', async () => {
      const owner = await registerUser('miembros-duplicado-owner@test.com');
      const project = await createProject(owner.token, 'Proyecto duplicado');

      const res = await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner.token))
        .send({ email: 'miembros-duplicado-owner@test.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/projects/:projectId/members/:userId', () => {
    it('elimina a un miembro y deja de mostrar el proyecto en su lista', async () => {
      const owner = await registerUser('miembros-eliminar-owner@test.com');
      const member = await registerUser('miembros-eliminar@test.com');
      const project = await createProject(owner.token, 'Proyecto compartido');
      await request(app)
        .post(`/api/projects/${project.id}/members`)
        .set(auth(owner.token))
        .send({ email: 'miembros-eliminar@test.com' });

      const res = await request(app)
        .delete(`/api/projects/${project.id}/members/${member.id}`)
        .set(auth(owner.token));
      const list = await request(app).get('/api/projects').set(auth(member.token));

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
      expect(list.status).toBe(200);
      expect(list.body).toEqual([]);
    });

    it('rechaza quitar al owner de su proyecto', async () => {
      const owner = await registerUser('miembros-owner-protegido@test.com');
      const project = await createProject(owner.token, 'Proyecto del owner');

      const res = await request(app)
        .delete(`/api/projects/${project.id}/members/${owner.id}`)
        .set(auth(owner.token));

      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'The project owner cannot be removed from the project',
      });
    });

    it('informa cuando se intenta quitar un usuario que no es miembro', async () => {
      const owner = await registerUser('miembros-ausente-owner@test.com');
      const outsider = await registerUser('miembros-ausente@test.com');
      const project = await createProject(owner.token, 'Proyecto sin ese miembro');

      const res = await request(app)
        .delete(`/api/projects/${project.id}/members/${outsider.id}`)
        .set(auth(owner.token));

      expect(res.status).toBe(404);
      expect(res.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'User is not a member of this project',
      });
    });
  });
});