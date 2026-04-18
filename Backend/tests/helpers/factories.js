const User = require('../../src/models/User');
const Student = require('../../src/models/Student');
const mongoose = require('mongoose');

const createTeacher = async (overrides = {}) => {
  return User.create({
    name: 'Ahmed Teacher',
    email: `teacher_${Date.now()}_${Math.random()}@test.com`,
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
