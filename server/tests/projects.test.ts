import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Proyectos', () => {
  it('crea un proyecto', async () => {
    const { token } = await registerUser('proj1@test.com');

    const res = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Mi Proyecto', description: 'Descripción' });

    expect(res.status).toBe(201);
  });

  it('lista los proyectos del usuario', async () => {
    const { token } = await registerUser('proj2@test.com');
    await request(app).post('/api/projects').set(auth(token)).send({ name: 'Proyecto A' });
    await request(app).post('/api/projects').set(auth(token)).send({ name: 'Proyecto B' });

    const res = await request(app).get('/api/projects').set(auth(token));

    expect(res.body).toHaveLength(2);
  });

  it('rechaza crear un proyecto sin autenticación', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Sin token' });

    expect(res.status).toBe(401);
  });

  describe('POST /api/projects', () => {
    it.each([
      ['abc', 'el mínimo de 3 caracteres'],
      ['a'.repeat(100), 'el máximo de 100 caracteres'],
    ])('crea un proyecto con %s', async (name) => {
      const { token } = await registerUser(`proyecto-valido-${name.length}@test.com`);

      const res = await request(app).post('/api/projects').set(auth(token)).send({ name });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(name);
    });

    it.each([
      ['sin nombre', undefined],
      ['con nombre vacío', '  '],
      ['con 2 caracteres', 'ab'],
      ['con 101 caracteres', 'a'.repeat(101)],
    ])('rechaza crear un proyecto %s', async (_scenario, name) => {
      const { token } = await registerUser(`proyecto-invalido-${String(name).length}-${Date.now()}@test.com`);

      const res = await request(app).post('/api/projects').set(auth(token)).send({ name });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza una descripción de más de 500 caracteres', async () => {
      const { token } = await registerUser('descripcion-larga@test.com');

      const res = await request(app)
        .post('/api/projects')
        .set(auth(token))
        .send({ name: 'Proyecto válido', description: 'a'.repeat(501) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza nombres duplicados para el mismo owner', async () => {
      const { token } = await registerUser('proyecto-duplicado@test.com');
      await request(app).post('/api/projects').set(auth(token)).send({ name: 'Proyecto único' });

      const res = await request(app)
        .post('/api/projects')
        .set(auth(token))
        .send({ name: 'Proyecto único' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });
});
