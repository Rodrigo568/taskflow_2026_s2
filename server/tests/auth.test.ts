import request from 'supertest';
import { app } from './helpers';

describe('Auth', () => {
  it('registra un usuario nuevo', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ana@test.com', password: 'Password1' });

    expect(res.status).toBe(201);
  });

  it('inicia sesión con credenciales válidas', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'Password1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password1' });

    expect(res.status).toBe(200);
  });

  it('rechaza el login con contraseña incorrecta', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'wrong@test.com', password: 'Password1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'Otracosa9' });

    expect(res.status).toBe(401);
  });

  describe('POST /api/auth/register', () => {
    it.each([
      ['Passw1Ab', 'límite mínimo de 8 caracteres'],
      ['Passw1Abc', 'un carácter por encima del mínimo'],
    ])('acepta una contraseña válida de %s', async (password) => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `registro-${password.length}@test.com`, password });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({ email: `registro-${password.length}@test.com` }),
        }),
      );
    });

    it('rechaza una contraseña de 7 caracteres', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'password-corta@test.com', password: 'Passw1A' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza un email con formato inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'email-invalido', password: 'Passw1Ab' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza un email ya registrado aunque cambie las mayúsculas', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'duplicado@test.com', password: 'Passw1Ab' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'DUPLICADO@test.com', password: 'Passw1Ab' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });
});
