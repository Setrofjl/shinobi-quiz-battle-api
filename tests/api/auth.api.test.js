'use strict';

const { app, request, bearer } = require('../setup/helpers');
const { sequelize } = require('../../src/models');

afterAll(() => sequelize.close());

describe('authentication and roles', () => {
  test('registration always creates a player and never returns the password hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      school_id: '2488-8888',
      full_name: 'New Shinobi',
      email: 'new.shinobi@example.test',
      password: 'StrongPass9',
      role: 'ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('PLAYER');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('unknown school IDs and wrong passwords share the same 401 response', async () => {
    const wrongPassword = await request(app).post('/api/v1/auth/login').send({
      school_id: '24179712',
      password: 'WrongPass9',
    });
    const unknownSchool = await request(app).post('/api/v1/auth/login').send({
      school_id: '99999999',
      password: 'WrongPass9',
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownSchool.status).toBe(401);
    expect(unknownSchool.body).toEqual(wrongPassword.body);
  });

  test('login and /auth/me return a safe user view', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      school_id: '24179712',
      password: 'Aklat-Demo-2026',
    });
    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({ token_type: 'Bearer', expires_in: expect.any(Number) });
    expect(login.body.user).not.toHaveProperty('password_hash');

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toEqual(login.body.user);
  });

  test('missing and tampered tokens are unauthorized', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);

    const authorization = await bearer('24179712');
    const parts = authorization.slice('Bearer '.length).split('.');
    parts[1] = `${parts[1][0] === 'a' ? 'b' : 'a'}${parts[1].slice(1)}`;
    const tampered = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${parts.join('.')}`);
    expect(tampered.status).toBe(401);
  });

  test('only admins may list accounts and admins cannot change their own role', async () => {
    const player = await bearer('24179723');
    expect((await request(app).get('/api/v1/users').set('Authorization', player)).status).toBe(403);

    const admin = await bearer('24179001');
    expect((await request(app).get('/api/v1/users').set('Authorization', admin)).status).toBe(200);
    const selfChange = await request(app)
      .patch('/api/v1/users/6/role')
      .set('Authorization', admin)
      .send({ role: 'PLAYER' });
    expect(selfChange.status).toBe(409);
  });
});
