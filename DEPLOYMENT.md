# Deployment Guide

This guide covers different ways to deploy the Tree Survey Application for production use.

## Table of Contents
1. [Local Network Deployment](#local-network-deployment)
2. [Cloud Deployment](#cloud-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Production Best Practices](#production-best-practices)

---

## Local Network Deployment

### Option 1: Direct Access on Local Network

This is the simplest option for small teams on the same network.

1. **Start the application on a central computer:**
   ```bash
   npm start
   ```

2. **Find the computer's IP address:**

   **On Mac/Linux:**
   ```bash
   ifconfig | grep "inet "
   # or
   hostname -I
   ```

   **On Windows:**
   ```bash
   ipconfig
   ```
   Look for the "IPv4 Address" (e.g., 192.168.1.100)

3. **Access from other devices:**
   ```
   http://192.168.1.100:3000
   ```

4. **Keep the application running:**

   **Using PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name tree-survey
   pm2 save
   pm2 startup  # Follow the instructions it gives
   ```

   **Using screen (Linux/Mac):**
   ```bash
   screen -S tree-survey
   npm start
   # Press Ctrl+A, then D to detach
   # Reattach with: screen -r tree-survey
   ```

### Option 2: Configure Custom Port

If port 3000 is already in use:

1. **Edit server.js** and change:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```
   to:
   ```javascript
   const PORT = process.env.PORT || 8080;  // or any available port
   ```

2. **Or set environment variable:**
   ```bash
   PORT=8080 npm start
   ```

---

## Cloud Deployment

### Heroku Deployment

1. **Install Heroku CLI:**
   ```bash
   # Mac
   brew tap heroku/brew && brew install heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Initialize Git repository (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Create Heroku app:**
   ```bash
   heroku create your-tree-survey-app
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Open the app:**
   ```bash
   heroku open
   ```

**Note:** Heroku's ephemeral filesystem means the JSON database will be lost on restarts. Consider using a proper database for production (see below).

### DigitalOcean Droplet

1. **Create a droplet** (Ubuntu 22.04 recommended)

2. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Upload your files:**
   ```bash
   # On your local machine
   scp -r "Planning Software" root@your-server-ip:/var/www/tree-survey
   ```

5. **On the server, install dependencies:**
   ```bash
   cd /var/www/tree-survey
   npm install
   ```

6. **Install PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name tree-survey
   pm2 startup systemd
   pm2 save
   ```

7. **Configure firewall:**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

8. **Access at:**
   ```
   http://your-server-ip:3000
   ```

### AWS EC2 Deployment

Similar to DigitalOcean, but:

1. Launch an EC2 instance (t2.micro is free tier eligible)
2. Configure Security Group to allow inbound traffic on port 3000
3. Follow the same Node.js installation steps as DigitalOcean
4. Consider using Elastic IP for a static IP address

### Azure Web App

1. **Create Azure Web App:**
   - Select Node.js runtime
   - Choose appropriate tier

2. **Deploy via Git:**
   ```bash
   git remote add azure <deployment-url>
   git push azure main
   ```

3. **Configure environment:**
   - Set Node version in Application Settings
   - Configure PORT environment variable if needed

---

## Docker Deployment

### Create Dockerfile

Create a file named `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD [ "node", "server.js" ]
```

### Create .dockerignore

```
node_modules
npm-debug.log
tree_survey.json
tree_survey_backup_*.json
.git
.gitignore
README.md
```

### Build and Run

```bash
# Build image
docker build -t tree-survey-app .

# Run container
docker run -p 3000:3000 -v $(pwd)/data:/usr/src/app tree-survey-app

# Or with docker-compose
```

### Docker Compose (recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  tree-survey:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/usr/src/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

---

## Production Best Practices

### 1. Use a Reverse Proxy (Nginx)

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Configure Nginx** (`/etc/nginx/sites-available/tree-survey`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/tree-survey /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Enable HTTPS with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Database Backup Strategy

**Automated daily backups:**

Create `/usr/local/bin/backup-tree-survey.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/tree-survey"
mkdir -p $BACKUP_DIR
cp /var/www/tree-survey/tree_survey.json $BACKUP_DIR/tree_survey_$(date +%Y%m%d_%H%M%S).json

# Keep only last 30 days of backups
find $BACKUP_DIR -name "tree_survey_*.json" -mtime +30 -delete
```

**Add to crontab:**
```bash
chmod +x /usr/local/bin/backup-tree-survey.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-tree-survey.sh
```

### 4. Monitoring and Logging

**Using PM2:**
```bash
# View logs
pm2 logs tree-survey

# Monitor
pm2 monit

# Web dashboard
pm2 install pm2-logrotate
```

### 5. Environment Variables

Create `.env` file (add to .gitignore):
```
NODE_ENV=production
PORT=3000
```

Update `server.js` to use:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### 6. Upgrade to Proper Database (Optional)

For production with multiple users, consider:

**SQLite:**
- File-based like JSON but more robust
- No server needed

**PostgreSQL/MySQL:**
- Full-featured database
- Better for concurrent users
- Requires database server

### 7. Security Considerations

- Keep Node.js and dependencies updated
- Use environment variables for sensitive data
- Enable firewall (ufw on Ubuntu)
- Regular security updates
- Consider authentication if publicly accessible

---

## Troubleshooting Deployment

### Application won't start on server
- Check Node.js version: `node --version`
- Verify dependencies installed: `npm install`
- Check logs: `pm2 logs` or `journalctl -u tree-survey`

### Can't access from other devices
- Verify firewall rules
- Check if app is listening on correct port
- Ensure using correct IP address
- Try with firewall temporarily disabled for testing

### Database issues
- Check file permissions on tree_survey.json
- Ensure directory is writable
- Verify backup process is working

### Memory issues
- Monitor with `pm2 monit`
- Increase server resources if needed
- Check for memory leaks in logs

---

## Support

For deployment issues, check:
1. Server logs
2. Application logs
3. Network connectivity
4. Firewall settings
5. Node.js version compatibility
