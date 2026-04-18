/**
 * ===========================================
 * Vercel Serverless Function Entry Point
 * ===========================================
 * This file is the entry point for Vercel Serverless Functions.
 * It exports the Express app as a serverless function.
 * 
 * Note: Connection caching is handled in database.js using global.mongoose
 */

const app = require('../src/app');
const connectDatabase = require('../src/config/database');
const mongoose = require('mongoose');

// Cache connection promise to avoid multiple connection attempts
let connectionPromise = null;

module.exports = async (req, res) => {
    // Ensure database connection before handling request
    // The connection will be cached globally by database.js
    try {
        if (!connectionPromise) {
            connectionPromise = connectDatabase();
        }
        
        // Wait for connection (will use cached connection if already connected)
        await connectionPromise;
        
        // Check if connection is ready
        if (mongoose.connection.readyState !== 1) {
            // Connection not ready, try to reconnect
            connectionPromise = connectDatabase();
            await connectionPromise;
        }
    } catch (error) {
        console.error('Database connection error:', error);
        connectionPromise = null; // Reset on error to allow retry
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Database connection failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }

    // Handle the request with Express app
    return app(req, res);
};

