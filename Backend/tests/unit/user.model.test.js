const db = require('../helpers/testDb');
const User = require('../../src/models/User');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1d';

beforeAll(() => db.connect());
afterEach(() => db.clearAll());
afterAll(() => db.disconnect());

const buildUser = (overrides = {}) => ({
  name: 'Test Teacher',
  email: `test_${Date.now()}_${Math.random()}@example.com`,
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
    expect(withPw.password).toMatch(/^\$2b\$/);
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
    const email = `dup_${Date.now()}@example.com`;
    await User.create(buildUser({ email }));
    await expect(User.create(buildUser({ email }))).rejects.toThrow();
  });
});
