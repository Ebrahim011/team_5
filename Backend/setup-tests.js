const fs = require('fs');
const path = require('path');

const files = {

// ─── HELPERS ────────────────────────────────────────────────────────────────

'tests/helpers/testDb.js': `
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongod;

const connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

const clearAll = async () => {
  for (const key in mongoose.connection.collections) {
    await mongoose.connection.collections[key].deleteMany({});
  }
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

module.exports = { connect, clearAll, disconnect };
`,

'tests/helpers/factories.js': `
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');
const mongoose = require('mongoose');

const createTeacher = async (overrides = {}) => {
  return User.create({
    name: 'Ahmed Teacher',
    email: \`teacher_\${Date.now()}_\${Math.random()}@test.com\`,
    password: 'Password123!',
    role: 'teacher',
    isVerified: true,
    isActive: true,
    ...overrides,
  });
};

const createTeacherWithToken = async (overrides = {}) => {
  const teacher = await createTeacher(overrides);
  const token = teacher.generateAuthToken();
  return { teacher, token };
};

const createStudent = async (teacherId, overrides = {}) => {
  return Student.create({
    fullName: 'Mohamed Student',
    grade: 'Grade 10',
    nationalId: Math.floor(1000 + Math.random() * 9000).toString(),
    teacherId: new mongoose.Types.ObjectId(teacherId),
    monthlyFee: 500,
    status: 'active',
    password: 'Student123!',
    ...overrides,
  });
};

const createOTP = async (email, type = 'registration') => {
  const OTP = require('../../src/models/OTP');
  return OTP.createOTP(email.toLowerCase(), type);
};

module.exports = { createTeacher, createTeacherWithToken, createStudent, createOTP };
`,

// ─── UNIT TESTS ─────────────────────────────────────────────────────────────

'tests/unit/apiError.test.js': `
const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  it('should create a 400 error', () => {
    const err = ApiError.badRequest('Bad input');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad input');
    expect(err.status).toBe('fail');
  });

  it('should create a 401 error', () => {
    const err = ApiError.unauthorized('No access');
    expect(err.statusCode).toBe(401);
  });

  it('should create a 403 error', () => {
    const err = ApiError.forbidden('Not allowed');
    expect(err.statusCode).toBe(403);
  });

  it('should create a 404 error', () => {
    const err = ApiError.notFound('Not found');
    expect(err.statusCode).toBe(404);
  });

  it('should create a 409 error', () => {
    const err = ApiError.conflict('Duplicate');
    expect(err.statusCode).toBe(409);
  });

  it('should create a 500 error with isOperational false', () => {
    const err = ApiError.internal('Server error');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('should set status to "fail" for 4xx', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe('fail');
  });

  it('should set status to "error" for 5xx', () => {
    const err = new ApiError(500, 'Server error');
    expect(err.status).toBe('error');
  });
});
`,

'tests/unit/user.model.test.js': `
const db = require('../helpers/testDb');
const User = require('../../src/models/User');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';

beforeAll(() => db.connect());
afterEach(() => db.clearAll());
afterAll(() => db.disconnect());

const buildUser = (overrides = {}) => ({
  name: 'Test Teacher',
  email: \`test_\${Date.now()}_\${Math.random()}@example.com\`,
  password: 'SecurePass123!',
  role: 'teacher',
  isVerified: true,
  isActive: true,
  ...overrides,
});

describe('User Model', () => {
  it('should create a valid user', async () => {
    const user = await User.create(buildUser());
    expect(user._id).toBeDefined();
    expect(user.role).toBe('teacher');
  });

  it('should hash the password', async () => {
    const user = await User.create(buildUser({ password: 'MyPass123!' }));
    const withPw = await User.findById(user._id).select('+password');
    expect(withPw.password).not.toBe('MyPass123!');
    expect(withPw.password).toMatch(/^\\$2b\\$/);
  });

  it('should generate teacherCode automatically', async () => {
    const user = await User.create(buildUser());
    expect(user.teacherCode).toBeDefined();
    expect(user.teacherCode).toHaveLength(5);
  });

  it('should not return password by default', async () => {
    const data = buildUser();
    await User.create(data);
    const found = await User.findOne({ email: data.email });
    expect(found.password).toBeUndefined();
  });

  it('should generate a valid JWT token', async () => {
    const user = await User.create(buildUser());
    const token = user.generateAuthToken();
    expect(token.split('.')).toHaveLength(3);
  });

  it('comparePassword() returns true for correct password', async () => {
    const user = await User.create(buildUser({ password: 'CorrectPass123!' }));
    const withPw = await User.findById(user._id).select('+password');
    const match = await withPw.comparePassword('CorrectPass123!');
    expect(match).toBe(true);
  });

  it('comparePassword() returns false for wrong password', async () => {
    const user = await User.create(buildUser({ password: 'RightPass123!' }));
    const withPw = await User.findById(user._id).select('+password');
    const match = await withPw.comparePassword('WrongPass!');
    expect(match).toBe(false);
  });

  it('should reject duplicate email', async () => {
    const email = \`dup_\${Date.now()}@example.com\`;
    await User.create(buildUser({ email }));
    await expect(User.create(buildUser({ email }))).rejects.toThrow();
  });
});
`,

'tests/unit/otp.model.test.js': `
const db = require('../helpers/testDb');
const OTP = require('../../src/models/OTP');

beforeAll(() => db.connect());
afterEach(() => db.clearAll());
afterAll(() => db.disconnect());

const EMAIL = 'otp_test@example.com';

describe('OTP Model', () => {
  it('should generate a 6-digit OTP', () => {
    const otp = OTP.generateOTP();
    expect(otp).toHaveLength(6);
    expect(Number(otp)).toBeGreaterThanOrEqual(100000);
  });

  it('should create an OTP document', async () => {
    const doc = await OTP.createOTP(EMAIL, 'registration');
    expect(doc.email).toBe(EMAIL);
    expect(doc.isUsed).toBe(false);
    expect(doc.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should delete old OTP when creating new one', async () => {
    await OTP.createOTP(EMAIL, 'registration');
    await OTP.createOTP(EMAIL, 'registration');
    const count = await OTP.countDocuments({ email: EMAIL, type: 'registration' });
    expect(count).toBe(1);
  });

  it('should verify a valid OTP', async () => {
    const created = await OTP.createOTP(EMAIL, 'registration');
    const verified = await OTP.verifyOTP(EMAIL, created.otp, 'registration');
    expect(verified).not.toBeNull();
    expect(verified.isUsed).toBe(true);
  });

  it('should return null for wrong OTP', async () => {
    await OTP.createOTP(EMAIL, 'registration');
    const result = await OTP.verifyOTP(EMAIL, '000000', 'registration');
    expect(result).toBeNull();
  });

  it('should return null for already used OTP', async () => {
    const created = await OTP.createOTP(EMAIL, 'registration');
    await OTP.verifyOTP(EMAIL, created.otp, 'registration');
    const second = await OTP.verifyOTP(EMAIL, created.otp, 'registration');
    expect(second).toBeNull();
  });

  it('should return null for expired OTP', async () => {
    await OTP.create({
      email: EMAIL,
      otp: '999999',
      type: 'registration',
      expiresAt: new Date(Date.now() - 1000),
    });
    const result = await OTP.verifyOTP(EMAIL, '999999', 'registration');
    expect(result).toBeNull();
  });

  it('checkOTP() should not mark OTP as used', async () => {
    const created = await OTP.createOTP(EMAIL, 'password-reset');
    await OTP.checkOTP(EMAIL, created.otp, 'password-reset');
    const doc = await OTP.findById(created._id);
    expect(doc.isUsed).toBe(false);
  });
});
`,

// ─── INTEGRATION TESTS ──────────────────────────────────────────────────────

'tests/integration/auth.routes.test.js': `
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
      .set('Authorization', \`Bearer \${token}\`);
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
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(200);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
`,

'tests/integration/student.routes.test.js': `
const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/testDb');
const { createTeacherWithToken, createStudent } = require('../helpers/factories');
const { Types } = require('mongoose');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';

beforeAll(() => db.connect());
afterEach(() => db.clearAll());
afterAll(() => db.disconnect());

describe('POST /api/students', () => {
  it('should create a student and return 201', async () => {
    const { token } = await createTeacherWithToken();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', \`Bearer \${token}\`)
      .send({ fullName: 'Omar Student', grade: 'Grade 10', monthlyFee: 500 });
    expect(res.status).toBe(201);
    expect(res.body.data.student.fullName).toBe('Omar Student');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/students').send({ fullName: 'Test', grade: 'Grade 10' });
    expect(res.status).toBe(401);
  });

  it('should return 400 when fullName is missing', async () => {
    const { token } = await createTeacherWithToken();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', \`Bearer \${token}\`)
      .send({ grade: 'Grade 10' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/students', () => {
  it('should return only my students', async () => {
    const { teacher: t1, token: token1 } = await createTeacherWithToken();
    const { teacher: t2 } = await createTeacherWithToken();
    await createStudent(t1._id, { fullName: 'Student A' });
    await createStudent(t1._id, { fullName: 'Student B' });
    await createStudent(t2._id, { fullName: 'Student C' });
    const res = await request(app).get('/api/students').set('Authorization', \`Bearer \${token1}\`);
    expect(res.status).toBe(200);
    expect(res.body.data.students).toHaveLength(2);
  });

  it('should return empty array when no students', async () => {
    const { token } = await createTeacherWithToken();
    const res = await request(app).get('/api/students').set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(200);
    expect(res.body.data.students).toHaveLength(0);
  });
});

describe('GET /api/students/:id', () => {
  it('should return a student by ID', async () => {
    const { teacher, token } = await createTeacherWithToken();
    const student = await createStudent(teacher._id);
    const res = await request(app)
      .get(\`/api/students/\${student._id}\`)
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(200);
  });

  it('should return 404 for non-existent ID', async () => {
    const { token } = await createTeacherWithToken();
    const res = await request(app)
      .get(\`/api/students/\${new Types.ObjectId()}\`)
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(404);
  });

  it('should return 404 for another teacher student (tenant isolation)', async () => {
    const { teacher: t1 } = await createTeacherWithToken();
    const { token: token2 } = await createTeacherWithToken();
    const student = await createStudent(t1._id);
    const res = await request(app)
      .get(\`/api/students/\${student._id}\`)
      .set('Authorization', \`Bearer \${token2}\`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/students/:id', () => {
  it('should delete a student successfully', async () => {
    const { teacher, token } = await createTeacherWithToken();
    const student = await createStudent(teacher._id);
    const res = await request(app)
      .delete(\`/api/students/\${student._id}\`)
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(200);
  });

  it('should return 404 for another teacher student', async () => {
    const { teacher: t1 } = await createTeacherWithToken();
    const { token: token2 } = await createTeacherWithToken();
    const student = await createStudent(t1._id);
    const res = await request(app)
      .delete(\`/api/students/\${student._id}\`)
      .set('Authorization', \`Bearer \${token2}\`);
    expect(res.status).toBe(404);
  });
});
`,

};

// ─── WRITE ALL FILES ────────────────────────────────────────────────────────

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trimStart());
  console.log(`✅ Created: ${filePath}`);
}

console.log('\n🎉 All test files created! Now run: npm test');
