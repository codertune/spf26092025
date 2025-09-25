# Smart Process Flow - Deployment Guide

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd smart-process-flow
```

### 2. Install Dependencies
```bash
# For local development, run the install script to set up everything:
./install.sh

# Or manually install dependencies:
npm install
# Create required directories
mkdir -p uploads results logs automation_scripts
```

### 3. Start Development Servers
```bash
# Start both frontend and backend servers
npm run dev:full

# Or start them separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 🌐 Ubuntu VPS Server Deployment

### Prerequisites
- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional)

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 4. Install Nginx (Web Server)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Clone and Setup Application
```bash
# Create application directory
sudo mkdir -p /var/www/smart-process-flow
cd /var/www/smart-process-flow

# Clone repository
sudo git clone <your-repository-url> .

# Set permissions
sudo chown -R $USER:$USER /var/www/smart-process-flow

# Install dependencies
npm install

# Build frontend for production
npm run build
```

### 6. Create PM2 Ecosystem File
```bash
sudo nano ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [{
    name: 'smart-process-flow-backend',
    script: 'server/index.cjs',
    cwd: '/var/www/smart-process-flow',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### 7. Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

### 8. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/smart-process-flow
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Serve static files
    location / {
        root /var/www/smart-process-flow/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running processes
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Handle file uploads
    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 9. Enable Nginx Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/smart-process-flow /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 10. Setup SSL with Let's Encrypt (Optional but Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 11. Setup Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 📁 Directory Structure
```
smart-process-flow/
├── src/                    # Frontend source code
├── server/                 # Backend server
├── dist/                   # Built frontend (after npm run build)
├── uploads/                # File uploads directory
├── results/                # Automation results
├── logs/                   # Application logs
├── automation_scripts/     # Python automation scripts
├── package.json
└── README.md
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:
```bash
# Application
NODE_ENV=production
PORT=3001

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# Automation
RESULTS_DIR=results
LOGS_DIR=logs
```

---

## 🐍 Python Dependencies (For Automation Scripts)

### Install Python and Dependencies
```bash
# Ubuntu
sudo apt install python3 python3-pip -y

# Install required packages
python3 -m pip install selenium pandas openpyxl beautifulsoup4 requests webdriver-manager

# Install Chrome for automation
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable -y

# Install ChromeDriver
sudo apt install chromium-chromedriver -y
```

---

## 📊 Monitoring and Maintenance

### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs smart-process-flow-backend

# Restart application
pm2 restart smart-process-flow-backend

# Stop application
pm2 stop smart-process-flow-backend

# Monitor resources
pm2 monit
```

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop

# Check port usage
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001
```

---

## 🔄 Updates and Deployment

### Update Application
```bash
cd /var/www/smart-process-flow

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build frontend
npm run build

# Restart backend
pm2 restart smart-process-flow-backend

# Restart Nginx (if config changed)
sudo systemctl restart nginx
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

2. **Permission denied errors**
   ```bash
   sudo chown -R $USER:$USER /var/www/smart-process-flow
   chmod -R 755 /var/www/smart-process-flow
   ```

3. **Nginx 502 Bad Gateway**
   - Check if backend is running: `pm2 list`
   - Check backend logs: `pm2 logs`
   - Verify port 3001 is accessible: `curl http://localhost:3001/api/health`

4. **File upload issues**
   ```bash
   # Create directories with proper permissions
   mkdir -p uploads results logs
   chmod 755 uploads results logs
   ```

5. **SSL certificate issues**
   ```bash
   sudo certbot renew --dry-run
   sudo systemctl restart nginx
   ```

---

## 📞 Support

For issues and support:
- Check logs: `pm2 logs` and `/var/log/nginx/error.log`
- Verify all services are running
- Check firewall settings
- Ensure domain DNS is properly configured

---

## 🔐 Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords and SSH keys**
3. **Enable firewall with minimal required ports**
4. **Regular backups**
5. **Monitor logs for suspicious activity**
6. **Use HTTPS with valid SSL certificates**

---

## 📈 Performance Optimization

1. **Enable Gzip compression in Nginx**
2. **Use CDN for static assets**
3. **Implement Redis for caching**
4. **Monitor resource usage with PM2**
5. **Regular database maintenance**
6. **Optimize images and assets**