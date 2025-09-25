const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import database services
const { 
  UserService, 
  WorkHistoryService, 
  BlogService, 
  SettingsService 
} = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure required directories exist
const requiredDirs = ['uploads', 'results', 'results/pdfs', 'logs', 'automation_scripts'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${fileExt}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Smart Process Flow Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==================== AUTH ROUTES ====================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Registration request received:', { 
    email: req.body.email, 
    name: req.body.name,
    company: req.body.company,
    mobile: req.body.mobile 
  });
  
  try {
    const { email, name, company, mobile, password } = req.body;
    
    // Validate required fields
    if (!email || !name || !company || !mobile || !password) {
      console.log('❌ Registration failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Registration failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Create user
    const newUser = await UserService.createUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      company: company.trim(),
      mobile: mobile.trim(),
      password: password
    });
    
    console.log('✅ User created successfully:', newUser.email);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: newUser
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or mobile number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Login failed: Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const user = await UserService.authenticateUser(email.toLowerCase().trim(), password);
    
    console.log('✅ User authenticated successfully:', user.email);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: user
    });
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }
    
    if (error.message.includes('password') || error.message.includes('Invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }
    
    if (error.message.includes('suspended')) {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// ==================== USER ROUTES ====================

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = await UserService.updateUser(req.params.id, req.body);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Add/Deduct credits
app.post('/api/users/:id/credits', async (req, res) => {
  try {
    const { credits, operation } = req.body;
    let newCredits;
    
    if (operation === 'add') {
      newCredits = await UserService.addCredits(req.params.id, credits);
    } else if (operation === 'deduct') {
      newCredits = await UserService.deductCredits(req.params.id, credits);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "deduct"'
      });
    }
    
    res.json({
      success: true,
      message: `Credits ${operation}ed successfully`,
      newCredits: newCredits
    });
  } catch (error) {
    console.error('❌ Credits operation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update credits'
    });
  }
});

// ==================== SETTINGS ROUTES ====================

// Get system settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SettingsService.getSettings();
    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Update system settings
app.put('/api/settings', async (req, res) => {
  try {
    const updatedSettings = await SettingsService.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// ==================== BLOG ROUTES ====================

// Get all blog posts
app.get('/api/blog', async (req, res) => {
  try {
    const posts = await BlogService.getAllBlogPosts();
    res.json({
      success: true,
      posts: posts
    });
  } catch (error) {
    console.error('❌ Get blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
});

// Create blog post
app.post('/api/blog', async (req, res) => {
  try {
    const newPost = await BlogService.createBlogPost(req.body);
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('❌ Create blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post'
    });
  }
});

// Update blog post
app.put('/api/blog/:id', async (req, res) => {
  try {
    const updatedPost = await BlogService.updateBlogPost(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('❌ Update blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post'
    });
  }
});

// Delete blog post
app.delete('/api/blog/:id', async (req, res) => {
  try {
    await BlogService.deleteBlogPost(req.params.id);
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post'
    });
  }
});

// ==================== WORK HISTORY ROUTES ====================

// Get work history for user
app.get('/api/work-history/:userId', async (req, res) => {
  try {
    const workHistory = await WorkHistoryService.getWorkHistory(req.params.userId);
    res.json({
      success: true,
      workHistory: workHistory
    });
  } catch (error) {
    console.error('❌ Get work history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work history'
    });
  }
});

// Add work history entry
app.post('/api/work-history', async (req, res) => {
  try {
    const { userId, ...workData } = req.body;
    const newWorkHistory = await WorkHistoryService.addWorkHistory(userId, workData);
    res.status(201).json({
      success: true,
      message: 'Work history added successfully',
      workHistory: newWorkHistory
    });
  } catch (error) {
    console.error('❌ Add work history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add work history'
    });
  }
});

// Update work history files
app.put('/api/work-history/:workId/files', async (req, res) => {
  try {
    const { resultFiles } = req.body;
    const updatedWorkHistory = await WorkHistoryService.updateWorkHistoryFiles(req.params.workId, resultFiles);
    res.json({
      success: true,
      message: 'Work history files updated successfully',
      workHistory: updatedWorkHistory
    });
  } catch (error) {
    console.error('❌ Update work history files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work history files'
    });
  }
});

// ==================== FILE UPLOAD ROUTES ====================

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`📁 Uploaded ${req.files.length} files:`, req.files.map(f => f.filename));

    const fileAnalysis = req.files.map(file => {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      let credits = 1;
      let rows = 1;

      // Basic analysis - more detailed analysis would be done client-side
      if (fileExtension === '.pdf') {
        credits = 1;
      } else if (['.xlsx', '.xls', '.csv'].includes(fileExtension)) {
        // Estimate based on file size for now
        const fileSizeKB = file.size / 1024;
        rows = Math.max(1, Math.floor(fileSizeKB / 2));
        credits = rows;
      }

      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        type: file.mimetype,
        credits: credits,
        rows: rows
      };
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${req.files.length} files`,
      files: fileAnalysis
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed: ' + error.message
    });
  }
});

// ==================== AUTOMATION ROUTES ====================

// Start automation process
app.post('/api/automation/start', async (req, res) => {
  try {
    const { serviceId, files, userCredentials, parameters } = req.body;
    
    console.log(`🚀 Starting automation for service: ${serviceId}`);
    console.log(`📁 Processing ${files.length} files`);
    
    const processId = uuidv4();
    
    // Map service IDs to Python script names
    const serviceScriptMap = {
      'damco-tracking-maersk': 'damco_tracking_maersk.py',
      'ctg-port-tracking': 'ctg_port_tracking.py',
      'example-automation': 'example_automation.py'
    };
    
    const scriptName = serviceScriptMap[serviceId];
    
    if (!scriptName) {
      return res.status(400).json({
        success: false,
        message: `Service ${serviceId} is not yet implemented`
      });
    }
    
    const scriptPath = path.join(__dirname, '..', 'automation_scripts', scriptName);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({
        success: false,
        message: `Automation script not found: ${scriptName}`
      });
    }
    
    // For now, return success - actual automation would be implemented here
    res.json({
      success: true,
      message: 'Automation started successfully',
      processId: processId,
      status: 'running'
    });
    
  } catch (error) {
    console.error('❌ Automation start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start automation: ' + error.message
    });
  }
});

// Get automation status
app.get('/api/automation/status/:processId', (req, res) => {
  // Mock status response - would be implemented with actual process tracking
  res.json({
    success: true,
    status: 'completed',
    progress: 100,
    output: [
      '🚀 Automation started successfully',
      '📋 Processing files...',
      '✅ Automation completed successfully'
    ],
    resultFiles: ['sample_report.pdf', 'automation_log.txt'],
    endTime: new Date().toISOString()
  });
});

// Stop automation process
app.post('/api/automation/stop/:processId', (req, res) => {
  res.json({
    success: true,
    message: 'Automation stopped successfully'
  });
});

// ==================== FILE SERVING ROUTES ====================

// Serve uploaded files
app.get('/api/files/:processId/:filename', (req, res) => {
  const { processId, filename } = req.params;
  const filePath = path.join(__dirname, '..', 'results', 'pdfs', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
});

// Preview PDF files
app.get('/api/preview/:processId/:filename', (req, res) => {
  const { processId, filename } = req.params;
  const filePath = path.join(__dirname, '..', 'results', 'pdfs', filename);
  
  if (fs.existsSync(filePath) && filename.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({
      success: false,
      message: 'PDF file not found'
    });
  }
});

// ==================== ERROR HANDLING ====================

// Handle multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
  console.log('🚀 Smart Process Flow Backend Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`📊 Results directory: ${path.resolve('results')}`);
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log('   POST /api/auth/register - User registration');
  console.log('   POST /api/auth/login - User login');
  console.log('   GET  /api/users - Get all users');
  console.log('   POST /api/upload - File upload');
  console.log('   POST /api/automation/start - Start automation');
  console.log('   GET  /api/settings - Get system settings');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});