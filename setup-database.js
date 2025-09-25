#!/usr/bin/env node

/**
 * Database Setup Script for Smart Process Flow
 * This script creates the database schema and initial data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_process_flow',
  user: process.env.DB_USER || 'spf_user',
  password: process.env.DB_PASSWORD || 'your_secure_password_here',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database setup...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database schema...');
    await client.query(schema);
    console.log('✅ Database schema created successfully');
    
    // Check if any users exist
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const hasUsers = parseInt(userCount.rows[0].count) > 0;
    
    if (!hasUsers) {
      console.log('👤 Creating demo users...');
      
      // Create demo users
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      // Demo user
      const userPassword = await bcrypt.hash('test123', 12);
      await client.query(
        `INSERT INTO users (
          id, email, name, company, mobile, password_hash, credits, is_admin, 
          status, email_verified, member_since, trial_ends_at, total_spent, last_activity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          uuidv4(),
          'test@example.com',
          'Test User',
          'Test Company Ltd',
          '+880 1234-567890',
          userPassword,
          100,
          false,
          'active',
          true,
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          0,
          new Date().toISOString().split('T')[0]
        ]
      );
      
      // Demo admin
      const adminPassword = await bcrypt.hash('admin123', 12);
      await client.query(
        `INSERT INTO users (
          id, email, name, company, mobile, password_hash, credits, is_admin, 
          status, email_verified, member_since, trial_ends_at, total_spent, last_activity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          uuidv4(),
          'admin@smartprocessflow.com',
          'Admin User',
          'Smart Process Flow',
          '+880 1234-567891',
          adminPassword,
          999999,
          true,
          'active',
          true,
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          0,
          new Date().toISOString().split('T')[0]
        ]
      );
      
      console.log('✅ Demo users created:');
      console.log('   👤 User: test@example.com / test123');
      console.log('   👨‍💼 Admin: admin@smartprocessflow.com / admin123');
    } else {
      console.log('👤 Users already exist, skipping demo user creation');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your .env file with database credentials');
    console.log('2. Start your application: npm run dev:full');
    console.log('3. Test login with demo accounts');
    console.log('');
    console.log('🔧 Database connection details:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'smart_process_flow'}`);
    console.log(`   User: ${process.env.DB_USER || 'spf_user'}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your database credentials in .env file');
    console.error('3. Ensure the database and user exist');
    console.error('4. Check network connectivity to database');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup
setupDatabase().catch(console.error);