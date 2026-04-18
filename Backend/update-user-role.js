/**
 * Script to update user role to 'teacher'
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Update the connection string and email below
 * 3. Run: node update-user-role.js
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config');

// Update this with your email
// TODO: Change this to your actual email address
const USER_EMAIL = 'your-email@example.com'; // ⚠️ Change this to your email

async function updateUserRole() {
    try {
        // Connect to MongoDB
        const dbUri = config.mongodb?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/class_track_db';
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB');

        // Find and update user
        const user = await User.findOneAndUpdate(
            { email: USER_EMAIL.toLowerCase() },
            { $set: { role: 'teacher' } },
            { new: true }
        );

        if (user) {
            console.log('✅ User role updated successfully!');
            console.log('User:', {
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            console.log('❌ User not found with email:', USER_EMAIL);
        }

        // Close connection
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
updateUserRole();

