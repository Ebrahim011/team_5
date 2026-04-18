const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/testDb');
const { createTeacher, createTeacherWithToken, createOTP } = require('../helpers/factories');
const User = require('../../src/models/User');

jest.mock('../../src/services/emailService', () => ({
  sendRegistrationOTP: jest.fn().mockResolvedValue(true),
  sendPasswordResetOTP: jest.fn().mockResolvedValue(true),
}));

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';

beforeAll(() => db.connect());
afterEach(() => db.clearAll());
afterAll(() => db.disconnect());

const validUser = {
  name: 'New Teacher',
  email: 'newteacher@example.com',
  password: 'SecurePass123!',
  phone: '01000000000',
  subject: 'Arabic',
};

describe('POST /api/auth/register', () => {
  it('should register and return 201', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should return 409 for duplicate verified email', async () => {
    await createTeacher({ email: validUser.email });
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'only@email.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login and return token', async () => {
    await createTeacher({ email: 'login@example.com', password: 'LoginPass123!' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'LoginPass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    await createTeacher({ email: 'wrong@example.com', password: 'RightPass123!' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrong@example.com',
      password: 'WrongPass999!',
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'AnyPass123!',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/profile', () => {
  it('should return profile for authenticated user', async () => {
    const { teacher, token } = await createTeacherWithToken();
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(teacher.email);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should return 200 for existing user', async () => {
    await createTeacher({ email: 'forgot@example.com' });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@example.com' });
    expect(res.status).toBe(200);
  });

  it('should return 200 even for non-existent email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/logout', () => {
  it('should return 200 for authenticated user', async () => {
    const { token } = await createTeacherWithToken();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
