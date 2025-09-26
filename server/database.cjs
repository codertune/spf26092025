const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

console.log('🔧 Database configuration:');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   Port: ${process.env.DB_PORT || 5432}`);
console.log(`   Database: ${process.env.DB_NAME || 'smart_process_flow'}`);
console.log(`   User: ${process.env.DB_USER || 'spf_user'}`);
console.log(`   SSL: ${process.env.DB_SSL === 'true' ? 'enabled' : 'disabled'}`);

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_process_flow',
  user: process.env.DB_USER || 'spf_user',
  password: process.env.DB_PASSWORD || 'PR3f9m602',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:', result.rows.map(row => row.table_name).join(', '));
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('💡 Make sure PostgreSQL is running and credentials are correct');
    console.error('🔧 Check your .env file for database configuration');
    console.error('📝 Full error:', err);
  }
}

testConnection();

// User Management Functions
class UserService {
  static async createUser(userData) {
    const client = await pool.connect();
    try {
      console.log('👤 Starting user creation process...');
      console.log('📧 Email:', userData.email);
      console.log('👤 Name:', userData.name);
      console.log('🏢 Company:', userData.company);
      console.log('📱 Mobile:', userData.mobile);
      console.log('🔐 Password provided:', !!userData.password);
      
      const { email, name, company, mobile, password } = userData;
      
      console.log('🔍 Checking if user already exists...');
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 OR mobile = $2',
        [email.toLowerCase(), mobile]
      );
      
      console.log('📊 Existing user query result:', existingUser.rows.length, 'rows found');
      
      if (existingUser.rows.length > 0) {
        console.log('❌ User already exists with email or mobile:', email, mobile);
        throw new Error('User with this email or mobile number already exists');
      }
      
      console.log('🔐 Hashing password...');
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      console.log('✅ Password hashed successfully');
      
      console.log('👑 Checking if this is the first user (admin)...');
      // Check if this is the first user (make them admin)
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log('📊 Current user count:', userCount.rows[0].count);
      const isFirstUser = parseInt(userCount.rows[0].count) === 0;
      console.log('👑 Is first user (admin):', isFirstUser);
      
      console.log('⚙️ Getting system settings for free trial credits...');
      // Get default settings
      const settingsResult = await client.query('SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1');
      console.log('📊 Settings query result:', settingsResult.rows.length, 'rows found');
      const freeTrialCredits = settingsResult.rows[0]?.free_trial_credits || 100;
      console.log('💳 Free trial credits:', freeTrialCredits);
      
      console.log('💾 Inserting new user into database...');
      console.log('📝 User data to insert:', {
        email: email.toLowerCase(),
        name,
        company,
        mobile,
        credits: freeTrialCredits,
        isAdmin: isFirstUser,
        status: 'active'
      });
      
      // Insert new user
      const result = await client.query(
        `INSERT INTO users (
          id, email, name, company, mobile, password_hash, credits, is_admin, 
          status, email_verified, member_since, trial_ends_at, total_spent, last_activity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING id, email, name, company, mobile, credits, is_admin, status, email_verified, member_since, trial_ends_at, total_spent, last_activity, created_at`,
        [
          uuidv4(),
          email.toLowerCase(),
          name,
          company,
          mobile,
          passwordHash,
          freeTrialCredits,
          isFirstUser,
          'active',
          false,
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          0,
          new Date().toISOString().split('T')[0]
        ]
      );
      
      console.log('✅ User inserted successfully! Database response:');
      console.log('📊 Rows affected:', result.rowCount);
      console.log('👤 Created user:', result.rows[0]);
      console.log('🆔 User ID:', result.rows[0].id);
      console.log('📧 User email:', result.rows[0].email);
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ ERROR in createUser function:');
      console.error('🔍 Error type:', error.constructor.name);
      console.error('📝 Error message:', error.message);
      console.error('📊 Error code:', error.code);
      console.error('🔧 Error details:', error.detail);
      console.error('💡 Error hint:', error.hint);
      console.error('📍 Full error object:', error);
      throw error;
    } finally {
      console.log('🔒 Releasing database client connection...');
      client.release();
      console.log('✅ Database client connection released');
    }
  }
  
  static async authenticateUser(email, password) {
    const client = await pool.connect();
    try {
      console.log('🔐 Authenticating user:', email);
      
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      
      if (result.rows.length === 0) {
        console.log('❌ User not found:', email);
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      if (user.status === 'suspended') {
        throw new Error('Account suspended. Please contact support.');
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', email);
        throw new Error('Invalid password');
      }
      
      // Update last activity
      await client.query(
        'UPDATE users SET last_activity = $1 WHERE id = $2',
        [new Date().toISOString().split('T')[0], user.id]
      );
      
      // Remove password hash from returned user
      const { password_hash, ...userWithoutPassword } = user;
      console.log('✅ User authenticated successfully:', email);
      return userWithoutPassword;
    } finally {
      client.release();
    }
  }
  
  static async getUserById(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, name, company, mobile, credits, is_admin, status, email_verified, member_since, trial_ends_at, total_spent, last_activity, created_at FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  static async getAllUsers() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, name, company, mobile, credits, is_admin, status, email_verified, member_since, trial_ends_at, total_spent, last_activity, created_at FROM users ORDER BY created_at DESC'
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  static async updateUser(userId, updates) {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic update query
      Object.keys(updates).forEach(key => {
        if (key !== 'id' && key !== 'password_hash') {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });
      
      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(userId);
      
      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}, updated_at = now() 
        WHERE id = $${paramIndex} 
        RETURNING id, email, name, company, mobile, credits, is_admin, status, email_verified, member_since, trial_ends_at, total_spent, last_activity, created_at
      `;
      
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  static async addCredits(userId, credits) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING credits',
        [credits, userId]
      );
      
      return result.rows[0]?.credits || 0;
    } finally {
      client.release();
    }
  }
  
  static async deductCredits(userId, credits) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE users SET credits = credits - $1 WHERE id = $2 AND credits >= $1 RETURNING credits',
        [credits, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Insufficient credits');
      }
      
      return result.rows[0].credits;
    } finally {
      client.release();
    }
  }
}

// Work History Management Functions
class WorkHistoryService {
  static async addWorkHistory(userId, workData) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO work_history (
          id, user_id, service_id, service_name, file_name, credits_used, 
          status, result_files, download_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          uuidv4(),
          userId,
          workData.serviceId,
          workData.serviceName,
          workData.fileName,
          workData.creditsUsed,
          workData.status,
          JSON.stringify(workData.resultFiles || []),
          workData.downloadUrl || null
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  static async getWorkHistory(userId, days = 7) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM work_history 
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
         ORDER BY created_at DESC`,
        [userId]
      );
      
      return result.rows.map(row => ({
        ...row,
        result_files: JSON.parse(row.result_files || '[]')
      }));
    } finally {
      client.release();
    }
  }
  
  static async updateWorkHistoryFiles(workId, resultFiles) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE work_history SET result_files = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(resultFiles), workId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  static async cleanupOldHistory(days = 7) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM work_history WHERE created_at < NOW() - INTERVAL '${days} days'`
      );
      
      return result.rowCount;
    } finally {
      client.release();
    }
  }
}

// Blog Post Management Functions
class BlogService {
  static async createBlogPost(postData) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO blog_posts (
          id, title, slug, content, excerpt, author, tags, featured, 
          status, meta_title, meta_description, meta_keywords, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *`,
        [
          uuidv4(),
          postData.title,
          postData.slug,
          postData.content,
          postData.excerpt,
          postData.author,
          postData.tags || [],
          postData.featured || false,
          postData.status || 'draft',
          postData.metaTitle,
          postData.metaDescription,
          postData.metaKeywords,
          postData.status === 'published' ? new Date() : null
        ]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  static async getAllBlogPosts() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM blog_posts ORDER BY created_at DESC'
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  static async getBlogPostBySlug(slug) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM blog_posts WHERE slug = $1',
        [slug]
      );
      
      if (result.rows.length > 0) {
        // Increment view count
        await client.query(
          'UPDATE blog_posts SET views = views + 1 WHERE id = $1',
          [result.rows[0].id]
        );
        
        result.rows[0].views += 1;
      }
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  static async updateBlogPost(postId, updates) {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });
      
      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(postId);
      
      const query = `
        UPDATE blog_posts 
        SET ${setClause.join(', ')}, updated_at = now() 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  static async deleteBlogPost(postId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM blog_posts WHERE id = $1 RETURNING *',
        [postId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

// System Settings Management Functions
class SettingsService {
  static async getSettings() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        // Create default settings if none exist
        return await this.createDefaultSettings();
      }
      
      const settings = result.rows[0];
      return {
        creditsPerBDT: parseFloat(settings.credits_per_bdt),
        creditsPerProcess: parseFloat(settings.credits_per_process),
        freeTrialCredits: parseInt(settings.free_trial_credits),
        minPurchaseCredits: parseInt(settings.min_purchase_credits),
        enabledServices: settings.enabled_services || [],
        systemNotification: settings.system_notification || {
          enabled: false,
          message: '',
          type: 'info',
          showToAll: true
        }
      };
    } finally {
      client.release();
    }
  }
  
  static async createDefaultSettings() {
    const client = await pool.connect();
    try {
      const defaultServices = [
        'pdf-excel-converter',
        'webcontainer-demo',
        'ctg-port-tracking',
        'exp-issue',
        'exp-correction',
        'exp-duplicate-reporting',
        'exp-search',
        'damco-booking',
        'damco-booking-download',
        'damco-fcr-submission',
        'damco-fcr-extractor',
        'damco-edoc-upload',
        'hm-einvoice-create',
        'hm-einvoice-download',
        'hm-einvoice-correction',
        'hm-packing-list',
        'bepza-ep-issue',
        'bepza-ep-submission',
        'bepza-ep-download',
        'bepza-ip-issue',
        'bepza-ip-submit',
        'bepza-ip-download',
        'cash-incentive-application',
        'damco-tracking-maersk',
        'myshipment-tracking',
        'egm-download',
        'custom-tracking'
      ];
      
      const result = await client.query(
        `INSERT INTO system_settings (
          id, credits_per_bdt, credits_per_process, free_trial_credits, 
          min_purchase_credits, enabled_services
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          uuidv4(),
          2.0,
          0.5,
          100,
          200,
          JSON.stringify(defaultServices)
        ]
      );
      
      const settings = result.rows[0];
      return {
        creditsPerBDT: parseFloat(settings.credits_per_bdt),
        creditsPerProcess: parseFloat(settings.credits_per_process),
        freeTrialCredits: parseInt(settings.free_trial_credits),
        minPurchaseCredits: parseInt(settings.min_purchase_credits),
        enabledServices: settings.enabled_services || [],
        systemNotification: {
          enabled: false,
          message: '',
          type: 'info',
          showToAll: true
        }
      };
    } finally {
      client.release();
    }
  }
  
  static async updateSettings(updates) {
    const client = await pool.connect();
    try {
      // Get current settings
      const currentResult = await client.query(
        'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1'
      );
      
      if (currentResult.rows.length === 0) {
        throw new Error('No settings found');
      }
      
      const currentSettings = currentResult.rows[0];
      
      // Prepare update data
      const updateData = {
        credits_per_bdt: updates.creditsPerBDT || currentSettings.credits_per_bdt,
        credits_per_process: updates.creditsPerProcess || currentSettings.credits_per_process,
        free_trial_credits: updates.freeTrialCredits || currentSettings.free_trial_credits,
        min_purchase_credits: updates.minPurchaseCredits || currentSettings.min_purchase_credits,
        enabled_services: JSON.stringify(updates.enabledServices || currentSettings.enabled_services),
        system_notification: JSON.stringify(updates.systemNotification || currentSettings.system_notification)
      };
      
      const result = await client.query(
        `UPDATE system_settings 
         SET credits_per_bdt = $1, credits_per_process = $2, free_trial_credits = $3, 
             min_purchase_credits = $4, enabled_services = $5, system_notification = $6, 
             updated_at = now()
         WHERE id = $7 
         RETURNING *`,
        [
          updateData.credits_per_bdt,
          updateData.credits_per_process,
          updateData.free_trial_credits,
          updateData.min_purchase_credits,
          updateData.enabled_services,
          updateData.system_notification,
          currentSettings.id
        ]
      );
      
      const settings = result.rows[0];
      return {
        creditsPerBDT: parseFloat(settings.credits_per_bdt),
        creditsPerProcess: parseFloat(settings.credits_per_process),
        freeTrialCredits: parseInt(settings.free_trial_credits),
        minPurchaseCredits: parseInt(settings.min_purchase_credits),
        enabledServices: JSON.parse(settings.enabled_services || '[]'),
        systemNotification: JSON.parse(settings.system_notification || '{}')
      };
    } finally {
      client.release();
    }
  }
}

module.exports = {
  pool,
  UserService,
  WorkHistoryService,
  BlogService,
  SettingsService
};