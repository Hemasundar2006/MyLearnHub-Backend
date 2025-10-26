# 🚀 Quick Start Guide

Get your MyLearnHub Backend up and running in 5 minutes!

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Set Up Environment

Copy the example environment file and use it as-is for development:

```bash
# The .env file is already configured with development defaults
# You can use it directly or modify as needed
```

### 3️⃣ Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4️⃣ Start the Server

```bash
# Development mode (recommended)
npm run dev

# Production mode
npm start
```

You should see:

```
========================================
🚀 Server running in development mode
📡 Server listening on port 5000
🌍 API URL: http://localhost:5000
========================================
MongoDB Connected: localhost
✅ Default admin user created successfully
Email: admin@mylearnhub.com
✅ 6 sample courses created successfully
========================================
```

### 5️⃣ Test the API

Open your browser and visit:

```
http://localhost:5000
```

You should see the API welcome message with available endpoints.

---

## 🎯 Quick Test

### Test 1: Health Check

```bash
curl http://localhost:5000/health
```

### Test 2: Get Public Courses

```bash
curl http://localhost:5000/api/courses
```

### Test 3: Admin Login

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mylearnhub.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@mylearnhub.com",
    "role": "admin"
  }
}
```

Copy the `token` value for the next test.

### Test 4: Create a Course (Admin Only)

```bash
curl -X POST http://localhost:5000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Course",
    "description": "This is a test course",
    "instructor": "Test Instructor",
    "duration": "2 weeks",
    "price": 1000,
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
  }'
```

---

## 📱 Testing with Postman

1. Import the Postman collection: `POSTMAN_COLLECTION.json`
2. Set the `base_url` variable to `http://localhost:5000/api`
3. Use the "Admin Login" request to get a token
4. Copy the token to the `admin_token` variable
5. Test all admin endpoints!

---

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@mylearnhub.com`
- Password: `Admin@123`

---

## 📚 What's Included

After starting the server, you'll have:

✅ **Admin User** - Pre-created admin account for testing  
✅ **6 Sample Courses** - Ready-to-use course data  
✅ **All API Endpoints** - Fully functional REST API  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Role-based Access** - User and Admin roles  

---

## 🎨 Sample Courses

The following courses are automatically created:

1. **React.js Complete Course** - Intermediate level
2. **Node.js Backend Development** - Intermediate level
3. **Python for Data Science** - Beginner level
4. **Mobile App Development with React Native** - Intermediate level
5. **UI/UX Design Fundamentals** - Beginner level
6. **Advanced JavaScript ES6+** - Advanced level (Draft)

---

## 🛠️ Available Endpoints

### Public Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get course by ID

### Protected Endpoints (Requires Token)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admin Endpoints (Requires Admin Token)
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/profile` - Get admin profile
- `GET /api/admin/courses` - Get all courses (including drafts)
- `POST /api/admin/courses` - Create new course
- `GET /api/admin/courses/:id` - Get course by ID
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course

---

## 🐛 Common Issues

### Issue: MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
1. Make sure MongoDB is running
2. Check MongoDB URI in `.env` file
3. Try: `mongodb://127.0.0.1:27017/mylearnhub` instead of `localhost`

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Change PORT in `.env` file to a different port (e.g., 5001)
2. Or kill the process using port 5000

### Issue: Admin Not Created

**Solution:**
The admin is created automatically on first server start. If it's not created:
1. Check MongoDB connection
2. Check console logs for errors
3. Delete the database and restart server

---

## 📖 Next Steps

1. ✅ **Read the API Documentation** - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. ✅ **Integration Guide** - [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. ✅ **Import Postman Collection** - [POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json)
4. ✅ **Start Building Your Frontend** - Connect your React/React Native app

---

## 🎉 You're Ready!

Your backend is now fully set up and ready to use. Start building your frontend application and integrate these APIs!

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

For frontend integration examples, see [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

**Happy Coding! 🚀**

