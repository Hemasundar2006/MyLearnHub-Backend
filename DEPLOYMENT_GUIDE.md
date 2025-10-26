# 🚀 Deployment Guide

Guide for deploying MyLearnHub Backend to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] Change default admin credentials
- [ ] Set strong JWT_SECRET
- [ ] Configure production MongoDB URI
- [ ] Set NODE_ENV to `production`
- [ ] Enable HTTPS
- [ ] Set up environment variables
- [ ] Review CORS settings
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting (optional)
- [ ] Set up backup strategy

---

## ☁️ Deployment Options

### Option 1: Heroku

#### Step 1: Install Heroku CLI
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
# Or use npm
npm install -g heroku
```

#### Step 2: Login to Heroku
```bash
heroku login
```

#### Step 3: Create Heroku App
```bash
heroku create mylearnhub-backend
```

#### Step 4: Add MongoDB Atlas
```bash
# Sign up at https://www.mongodb.com/cloud/atlas
# Create a cluster and get connection string

# Add to Heroku config
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/mylearnhub"
```

#### Step 5: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your_super_secret_jwt_key_here"
heroku config:set JWT_EXPIRE=7d
heroku config:set ADMIN_EMAIL="admin@yourdomain.com"
heroku config:set ADMIN_PASSWORD="YourStrongPassword123!"
```

#### Step 6: Deploy
```bash
git add .
git commit -m "Ready for deployment"
git push heroku main
```

#### Step 7: Open App
```bash
heroku open
```

---

### Option 2: Railway.app

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login
```bash
railway login
```

#### Step 3: Initialize Project
```bash
railway init
```

#### Step 4: Add MongoDB
```bash
railway add
# Select MongoDB plugin
```

#### Step 5: Set Variables
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your_secret_key"
railway variables set ADMIN_EMAIL="admin@yourdomain.com"
railway variables set ADMIN_PASSWORD="YourStrongPassword"
```

#### Step 6: Deploy
```bash
railway up
```

---

### Option 3: Render.com

#### Step 1: Create Account
Visit https://render.com and sign up

#### Step 2: New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Or use "Deploy an existing image"

#### Step 3: Configure Build
```
Build Command: npm install
Start Command: npm start
```

#### Step 4: Environment Variables
Add in Render dashboard:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword
```

#### Step 5: Deploy
Render will automatically deploy on git push

---

### Option 4: DigitalOcean App Platform

#### Step 1: Create Account
Visit https://www.digitalocean.com

#### Step 2: Create App
- Click "Create" → "Apps"
- Connect GitHub repository

#### Step 3: Configure
```
Run Command: npm start
Build Command: npm install
```

#### Step 4: Add MongoDB
Use DigitalOcean Managed Database or MongoDB Atlas

#### Step 5: Environment Variables
Add in App Settings

#### Step 6: Deploy
Automatic deployment on push

---

### Option 5: AWS (EC2 + MongoDB Atlas)

#### Step 1: Launch EC2 Instance
```bash
# Ubuntu 20.04 LTS recommended
# t2.micro for small apps
```

#### Step 2: Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 4: Install PM2
```bash
sudo npm install -g pm2
```

#### Step 5: Clone Repository
```bash
git clone <your-repo-url>
cd MyLearnHub-Backend
```

#### Step 6: Install Dependencies
```bash
npm install --production
```

#### Step 7: Create .env File
```bash
nano .env
# Add your production environment variables
```

#### Step 8: Start with PM2
```bash
pm2 start server.js --name mylearnhub-backend
pm2 startup
pm2 save
```

#### Step 9: Setup Nginx (Optional)
```bash
sudo apt install nginx

# Configure nginx as reverse proxy
sudo nano /etc/nginx/sites-available/mylearnhub
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mylearnhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 6: Vercel (Serverless)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

#### Step 3: Deploy
```bash
vercel
```

#### Step 4: Set Environment Variables
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
# ... add all variables
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
```bash
# NEVER commit .env file
# Use strong, random values in production

# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Change Default Admin Credentials
```bash
# After first deployment, immediately:
# 1. Login as admin
# 2. Change password via profile update
# 3. Or manually update in database
```

### 3. CORS Configuration
Update `server.js` for production:

```javascript
// Development - Allow all origins
app.use(cors());

// Production - Specific origins only
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
  credentials: true
}));
```

### 4. Rate Limiting (Optional)
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. Helmet for Security Headers
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 📊 MongoDB Atlas Setup

### Step 1: Create Account
Visit https://www.mongodb.com/cloud/atlas

### Step 2: Create Cluster
- Choose Free Tier (M0)
- Select region closest to your app
- Create cluster

### Step 3: Create Database User
- Database Access → Add New Database User
- Set username and strong password
- Grant "Read and Write" permissions

### Step 4: Network Access
- Network Access → Add IP Address
- Allow access from anywhere: `0.0.0.0/0` (for cloud deployments)
- Or specific IPs for better security

### Step 5: Get Connection String
- Clusters → Connect → Connect your application
- Copy connection string
- Replace `<password>` with your database user password
- Replace `<dbname>` with `mylearnhub`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mylearnhub?retryWrites=true&w=majority
```

---

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-api-url.com/health
```

### 2. Admin Login
```bash
curl -X POST https://your-api-url.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourNewPassword"
  }'
```

### 3. Get Courses
```bash
curl https://your-api-url.com/api/courses
```

### 4. Monitor Logs
```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# PM2 (VPS)
pm2 logs
```

---

## 📈 Monitoring & Maintenance

### 1. Set Up Logging
Consider using:
- LogRocket
- Sentry
- Datadog
- New Relic

### 2. Database Backups
MongoDB Atlas provides automatic backups

### 3. Update Dependencies
```bash
npm outdated
npm update
```

### 4. Monitor Performance
- Response times
- Error rates
- Database queries
- API usage

---

## 🆘 Troubleshooting

### Issue: App Crashes on Start
**Check:**
- Environment variables are set
- MongoDB connection string is correct
- PORT is not hardcoded (use `process.env.PORT`)

### Issue: Cannot Connect to MongoDB
**Check:**
- MongoDB Atlas IP whitelist
- Connection string format
- Database user credentials
- Network connectivity

### Issue: 502 Bad Gateway
**Check:**
- App is running
- Port configuration
- Nginx configuration (if using)

---

## 📝 Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|------------|
| PORT | 5000 | Set by platform or custom |
| NODE_ENV | development | production |
| MONGODB_URI | localhost | MongoDB Atlas URI |
| JWT_SECRET | simple_key | Strong random string |
| JWT_EXPIRE | 7d | 7d or custom |
| ADMIN_EMAIL | admin@mylearnhub.com | your@domain.com |
| ADMIN_PASSWORD | Admin@123 | Strong password |

---

## 🎯 Quick Deploy Commands

### Heroku
```bash
git push heroku main
```

### Railway
```bash
railway up
```

### Vercel
```bash
vercel --prod
```

### PM2 (VPS)
```bash
pm2 restart mylearnhub-backend
```

---

## 🔄 CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        MONGODB_URI: ${{ secrets.MONGODB_URI }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
        heroku_app_name: "mylearnhub-backend"
        heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## ✅ Deployment Checklist

- [ ] Code is committed and pushed to Git
- [ ] Environment variables configured
- [ ] MongoDB Atlas set up and accessible
- [ ] Admin credentials changed from defaults
- [ ] CORS configured for your frontend
- [ ] Health check endpoint responds
- [ ] Admin login works
- [ ] Public endpoints work
- [ ] Admin endpoints require authentication
- [ ] Logs are accessible
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Domain name configured (if applicable)
- [ ] SSL certificate installed (HTTPS)
- [ ] Documentation updated with new URLs

---

**Your MyLearnHub Backend is now production-ready! 🎉**

