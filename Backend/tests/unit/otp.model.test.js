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
