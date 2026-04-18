const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const financeRoutes = require('./financeRoutes');
const examRoutes = require('./examRoutes');
const sessionRoutes = require('./sessionRoutes');
const assistantRoutes = require('./assistantRoutes');
const messageRoutes = require('./messageRoutes');
const additionalServiceRoutes = require('./additionalServiceRoutes');
const adminRoutes = require('./adminRoutes');
const reportRoutes = require('./reportRoutes');
const dashboardRoutes = require('./dashboardRoutes');

router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/students', studentRoutes);
router.use('/exams', examRoutes);
router.use('/additional-services', additionalServiceRoutes);
router.use('/messages', messageRoutes);
router.use('/assistants', assistantRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/finance', financeRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
