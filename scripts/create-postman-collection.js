'use strict';

const fs = require('fs');
const path = require('path');

const output = path.join(
  __dirname,
  '..',
  'postman',
  'Shinobi-Quiz-Battle.postman_collection.json'
);

const baseUrl = '{{baseUrl}}';
const adminAuth = {
  type: 'bearer',
  bearer: [{ key: 'token', value: '{{adminToken}}', type: 'string' }],
};
const playerAuth = {
  type: 'bearer',
  bearer: [{ key: 'token', value: '{{playerToken}}', type: 'string' }],
};

function test(name, code) {
  return `pm.test(${JSON.stringify(name)}, function () { ${code} });`;
}

function request(name, method, endpoint, options = {}) {
  const headers = options.headers || [];
  const item = {
    name,
    request: {
      method,
      header: headers,
      url: {
        raw: `${baseUrl}${endpoint}`,
        host: [baseUrl],
        path: endpoint.replace(/^\//, '').split('/'),
      },
    },
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: options.tests || [
            test('Expected HTTP status', `pm.response.to.have.status(${options.status || 200});`),
          ],
        },
      },
    ],
  };

  if (options.body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(options.body),
      options: { raw: { language: 'json' } },
    };
    item.request.header.push({
      key: 'Content-Type',
      value: 'application/json',
    });
  }

  if (options.auth) item.request.auth = options.auth;

  return item;
}

const json = (code) => `const data = pm.response.json(); ${code}`;
const status = (code) => test(`Returns HTTP ${code}`, `pm.response.to.have.status(${code});`);

const items = [];

// 1–5: Public API and Hub API
items.push(
  request('01 - Health check', 'GET', '/health', {
    tests: [
      status(200),
      test('Health status is OK', `${json("pm.expect(data.status).to.eql('ok');")}`),
      test('Database is available', `${json("pm.expect(data.database).to.eql('up');")}`),
    ],
  }),

  request('02 - Get game information', 'GET', '/game-info', {
    tests: [
      status(200),
      test('Game slug is correct', `${json("pm.expect(data.slug).to.eql('shinobi-quiz-battle');")}`),
    ],
  }),

  request('03 - Results without Hub key', 'GET', '/results', {
    tests: [
      status(401),
      test('Hub key is required', `${json("pm.expect(data.error.code).to.eql('HUB_KEY_REQUIRED');")}`),
    ],
  }),

  request('04 - Results with Hub key', 'GET', '/results', {
    headers: [{ key: 'X-Hub-Key', value: '{{hubKey}}' }],
    tests: [
      status(200),
      test('Results response contains results', `${json("pm.expect(data).to.have.property('results');")}`),
    ],
  }),

  request('05 - Results with invalid since value', 'GET', '/results?since=not-a-date', {
    headers: [{ key: 'X-Hub-Key', value: '{{hubKey}}' }],
    tests: [
      status(400),
      test('Invalid date is rejected', `${json("pm.expect(data.error.code).to.eql('INVALID_SINCE');")}`),
    ],
  })
);

// 6–13: Login and authentication
items.push(
  request('06 - Admin login', 'POST', '/auth/login', {
    body: {
      school_id: 'ADMIN-TEST-001',
      password: 'ShinobiDemo2026!',
    },
    tests: [
      status(200),
      test('Admin token is returned', `${json("pm.expect(data.token).to.be.a('string'); pm.collectionVariables.set('adminToken', data.token);")}`),
      test('Admin role is correct', `${json("pm.expect(data.user.role).to.eql('ADMIN');")}`),
    ],
  }),

  request('07 - Admin gets own profile', 'GET', '/auth/me', {
    auth: adminAuth,
    tests: [
      status(200),
      test('Profile belongs to admin', `${json("pm.expect(data.user.school_id).to.eql('ADMIN-TEST-001');")}`),
      test('Password hash is not exposed', `${json("pm.expect(data.user).not.to.have.property('password_hash');")}`),
    ],
  }),

  request('08 - Profile without token', 'GET', '/auth/me', {
    tests: [status(401)],
  }),

  request('09 - Profile with invalid token', 'GET', '/auth/me', {
    headers: [{ key: 'Authorization', value: 'Bearer invalid.token.value' }],
    tests: [status(401)],
  }),

  request('10 - Profile with X-Demo-User only', 'GET', '/auth/me', {
    headers: [{ key: 'X-Demo-User', value: '24179723' }],
    tests: [status(401)],
  }),

  request('11 - Player login', 'POST', '/auth/login', {
    body: {
      school_id: '24179723',
      password: 'ShinobiDemo2026!',
    },
    tests: [
      status(200),
      test('Player token is returned', `${json("pm.expect(data.token).to.be.a('string'); pm.collectionVariables.set('playerToken', data.token);")}`),
      test('Player role is correct', `${json("pm.expect(data.user.role.toUpperCase()).to.eql('PLAYER');")}`),
    ],
  }),

  request('12 - Player gets own profile', 'GET', '/auth/me', {
    auth: playerAuth,
    tests: [
      status(200),
      test('Profile belongs to player', `${json("pm.expect(data.user.school_id).to.eql('24179723');")}`),
    ],
  }),

  request('13 - Unknown account login', 'POST', '/auth/login', {
    body: {
      school_id: 'UNKNOWN-ACCOUNT-999',
      password: 'WrongPass123',
    },
    tests: [
      status(401),
      test('Invalid credentials response', `${json("pm.expect(data.error.code).to.eql('INVALID_CREDENTIALS');")}`),
    ],
  })
);

// 14–21: Registration and account validation
const registerBody = {
  school_id: '{{testSchoolId}}',
  full_name: 'Postman Test Player',
  email: '{{testEmail}}',
  password: 'PostmanPass123',
  role: 'ADMIN',
};

items.push(
  request('14 - Register player with attempted ADMIN role injection', 'POST', '/auth/register', {
    body: registerBody,
    tests: [
      status(201),
      test('New account is forced to PLAYER', `${json("pm.expect(data.user.role).to.eql('PLAYER'); pm.collectionVariables.set('testUserId', String(data.user.user_id));")}`),
      test('Password hash is not returned', `${json("pm.expect(data.user).not.to.have.property('password_hash');")}`),
    ],
  }),

  request('15 - Register duplicate school ID', 'POST', '/auth/register', {
    body: registerBody,
    tests: [status(409)],
  }),

  request('16 - Register with weak password', 'POST', '/auth/register', {
    body: {
      school_id: 'WEAK-PASS-001',
      full_name: 'Weak Password User',
      email: 'weak-password@example.test',
      password: '123',
    },
    tests: [status(400)],
  }),

  request('17 - Register with invalid email', 'POST', '/auth/register', {
    body: {
      school_id: 'INVALID-EMAIL-001',
      full_name: 'Invalid Email User',
      email: 'not-an-email',
      password: 'ValidPass123',
    },
    tests: [status(400)],
  }),

  request('18 - Login with newly registered player', 'POST', '/auth/login', {
    body: {
      school_id: '{{testSchoolId}}',
      password: 'PostmanPass123',
    },
    tests: [
      status(200),
      test('New player token is saved', `${json("pm.expect(data.token).to.be.a('string'); pm.collectionVariables.set('newPlayerToken', data.token);")}`),
    ],
  }),

  request('19 - Newly registered player profile', 'GET', '/auth/me', {
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{newPlayerToken}}', type: 'string' }],
    },
    tests: [
      status(200),
      test('Registered school ID matches', `${json("pm.expect(data.user.school_id).to.eql(pm.collectionVariables.get('testSchoolId'));")}`),
    ],
  }),

  request('20 - Login with wrong password', 'POST', '/auth/login', {
    body: {
      school_id: 'ADMIN-TEST-001',
      password: 'IncorrectPassword123',
    },
    tests: [
      status(401),
      test('Wrong password uses generic error', `${json("pm.expect(data.error.code).to.eql('INVALID_CREDENTIALS');")}`),
    ],
  }),

  request('21 - Register with missing required fields', 'POST', '/auth/register', {
    body: { school_id: 'INCOMPLETE-001' },
    tests: [status(400)],
  })
);

// 22–30: Admin authorization and role management
items.push(
  request('22 - Get users without token', 'GET', '/users', {
    tests: [status(401)],
  }),

  request('23 - Player cannot list users', 'GET', '/users', {
    auth: playerAuth,
    tests: [status(403)],
  }),

  request('24 - Admin lists users', 'GET', '/users', {
    auth: adminAuth,
    tests: [
      status(200),
      test('Users list is returned', `${json("pm.expect(data.users).to.be.an('array');")}`),
      test('Test player exists in list', `${json("const u = data.users.find(x => x.school_id === pm.collectionVariables.get('testSchoolId')); pm.expect(u).to.exist; pm.collectionVariables.set('testUserId', String(u.user_id));")}`),
    ],
  }),

  request('25 - Admin cannot change own role', 'PATCH', '/users/5/role', {
    auth: adminAuth,
    body: { role: 'PLAYER' },
    tests: [status(409)],
  }),

  request('26 - Reject invalid role value', 'PATCH', '/users/{{testUserId}}/role', {
    auth: adminAuth,
    body: { role: 'SUPERADMIN' },
    tests: [status(400)],
  }),

  request('27 - Reject nonexistent user ID', 'PATCH', '/users/999999/role', {
    auth: adminAuth,
    body: { role: 'PLAYER' },
    tests: [status(404)],
  }),

  request('28 - Admin promotes test player to HOST', 'PATCH', '/users/{{testUserId}}/role', {
    auth: adminAuth,
    body: { role: 'HOST' },
    tests: [
      status(200),
      test('User role becomes HOST', `${json("pm.expect(data.user.role).to.eql('HOST');")}`),
    ],
  }),

  request('29 - HOST cannot access admin user list', 'GET', '/users', {
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{newPlayerToken}}', type: 'string' }],
    },
    tests: [status(403)],
  }),

  request('30 - Admin restores test player role', 'PATCH', '/users/{{testUserId}}/role', {
    auth: adminAuth,
    body: { role: 'PLAYER' },
    tests: [
      status(200),
      test('User role is restored to PLAYER', `${json("pm.expect(data.user.role).to.eql('PLAYER');")}`),
    ],
  }),

  request('31 - Admin can still access users after role update', 'GET', '/users', {
    auth: adminAuth,
    tests: [status(200)],
  }),

  request('32 - Player cannot change another user role', 'PATCH', '/users/5/role', {
    auth: playerAuth,
    body: { role: 'PLAYER' },
    tests: [status(403)],
  })
);

const collection = {
  info: {
    name: 'Shinobi Quiz Battle API - Week 12 M1',
    description: 'Authentication, JWT, RBAC, user management, health, game information, and Hub API tests.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          "if (!pm.collectionVariables.get('runId')) {",
          "  const id = Date.now().toString();",
          "  pm.collectionVariables.set('runId', id);",
          "  pm.collectionVariables.set('testSchoolId', 'W12-' + id.slice(-12));",
          "  pm.collectionVariables.set('testEmail', 'postman-' + id + '@example.test');",
          '}',
        ],
      },
    },
  ],
  variable: [
    { key: 'adminToken', value: '' },
    { key: 'playerToken', value: '' },
    { key: 'newPlayerToken', value: '' },
    { key: 'testUserId', value: '' },
    { key: 'testSchoolId', value: '' },
    { key: 'testEmail', value: '' },
    { key: 'runId', value: '' },
  ],
  item: items,
};

fs.writeFileSync(output, JSON.stringify(collection, null, 2), 'utf8');

console.log(`Created: ${output}`);
console.log(`Requests: ${items.length}`);