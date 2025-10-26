# 🚀 START HERE - MyLearnHub Backend

> **Complete Admin Authentication & Course Management API**

---

## ⚡ Quick Start (5 Minutes)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Ensure MongoDB is Running
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 3️⃣ Start the Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Default admin user created successfully
✅ 6 sample courses created successfully
🚀 Server running on port 5000
```

### 4️⃣ Test It
Open browser: http://localhost:5000

---

## 🔑 Default Admin Login

```
Email: admin@mylearnhub.com
Password: Admin@123
```

**⚠️ Change these credentials before deploying to production!**

---

## 📚 What You Have

### ✅ Fully Functional API
- User registration & login
- Admin authentication with role checking
- Complete course CRUD operations
- JWT token authentication
- Role-based access control

### ✅ Ready to Use
- 6 sample courses pre-loaded
- Admin user pre-created
- All endpoints tested and working
- Comprehensive error handling

---

## 🎯 Main Endpoints

### Public
```bash
# Get all published courses
curl http://localhost:5000/api/courses

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"test123"}'
```

### Admin
```bash
# Admin login
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mylearnhub.com","password":"Admin@123"}'

# Create course (use token from login)
curl -X POST http://localhost:5000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title":"New Course",
    "description":"Course description",
    "instructor":"Instructor Name",
    "duration":"4 weeks",
    "price":3000,
    "image":"https://example.com/image.jpg"
  }'
```

---

## 📖 Documentation

| Guide | When to Use |
|-------|-------------|
| **[README.md](./README.md)** | Project overview |
| **[QUICK_START.md](./QUICK_START.md)** | Detailed setup guide |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | Complete API reference |
| **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** | Frontend integration |
| **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** | Testing all endpoints |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Deploy to production |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** | Code organization |
| **[SUMMARY.md](./SUMMARY.md)** | Complete overview |

---

## 🎨 Import Postman Collection

1. Open Postman
2. Import → Upload Files
3. Select `POSTMAN_COLLECTION.json`
4. Set `base_url` to `http://localhost:5000/api`
5. Test all endpoints!

---

## 🔍 What's Included

```
✅ User Authentication
   - Register, Login, Profile, Update

✅ Admin Authentication  
   - Admin Login, Admin Profile
   - Role-based access control

✅ Course Management (Admin)
   - Create, Read, Update, Delete courses
   - Manage course status (draft/published)
   - Access all courses including drafts

✅ Public Course Access
   - View published courses
   - Get course details

✅ Security
   - JWT authentication
   - Password hashing
   - Role verification
   - Protected routes
```

---

## 🌟 Next Steps

### For Testing
1. ✅ Use Postman collection provided
2. ✅ Read `TESTING_GUIDE.md` for complete tests
3. ✅ Try all endpoints with different scenarios

### For Frontend Integration
1. ✅ Read `INTEGRATION_GUIDE.md`
2. ✅ Copy service layer examples
3. ✅ Update your AuthContext
4. ✅ Create admin screens

### For Deployment
1. ✅ Read `DEPLOYMENT_GUIDE.md`
2. ✅ Choose your platform (Heroku, Railway, AWS, etc.)
3. ✅ Set up MongoDB Atlas
4. ✅ Configure environment variables
5. ✅ Deploy!

---

## 🔧 Environment Configuration

The `.env` file is already configured with defaults:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mylearnhub
JWT_SECRET=mylearnhub_super_secret_jwt_key_2025_change_in_production
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@mylearnhub.com
ADMIN_PASSWORD=Admin@123
```

✏️ Modify as needed for your setup.

---

## 📱 Frontend Integration Quick Example

```javascript
// Login example
import axios from 'axios';

const login = async (email, password) => {
  const response = await axios.post('http://localhost:5000/api/auth/login', {
    email,
    password
  });
  
  // Save token
  localStorage.setItem('token', response.data.token);
  
  // Check if admin
  if (response.data.user.role === 'admin') {
    // Show admin dashboard
  }
};

// Get courses
const getCourses = async () => {
  const response = await axios.get('http://localhost:5000/api/courses');
  return response.data.courses;
};

// Create course (admin only)
const createCourse = async (courseData, token) => {
  const response = await axios.post(
    'http://localhost:5000/api/admin/courses',
    courseData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
```

More examples in `INTEGRATION_GUIDE.md`!

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### Admin Not Created
```bash
# Check console logs for errors
# Delete database and restart server
```

---

## 🎊 You're Ready!

Your backend is fully functional and ready to use!

### Test it now:
```bash
# In browser
http://localhost:5000

# Expected response:
{
  "success": true,
  "message": "MyLearnHub Backend API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

---

## 📞 Quick Commands

```bash
# Start server (dev mode)
npm run dev

# Start server (production mode)
npm start

# Install dependencies
npm install

# Check if server is running
curl http://localhost:5000/health
```

---

## 🎯 Key Files to Know

| File | What It Does |
|------|--------------|
| `server.js` | Main application entry |
| `routes/` | API endpoints |
| `controllers/` | Business logic |
| `models/` | Database schemas |
| `middleware/` | Auth & authorization |

---

## 💡 Pro Tips

1. **Use Postman** - Import the collection for easy testing
2. **Check Docs** - API_DOCUMENTATION.md has all endpoint details
3. **Frontend** - INTEGRATION_GUIDE.md has ready-to-use code
4. **Testing** - TESTING_GUIDE.md has complete test cases
5. **Deploy** - DEPLOYMENT_GUIDE.md covers all platforms

---

## 🎉 Success Checklist

- [x] Backend code complete
- [x] Database models defined
- [x] Authentication working
- [x] Admin system functional
- [x] Sample data loaded
- [x] Documentation complete
- [x] Ready to integrate
- [x] Ready to deploy

---

**Everything you need is ready! Start building! 🚀**

### Need Help?
- Check the relevant guide in the docs folder
- All endpoints are documented in API_DOCUMENTATION.md
- Integration examples in INTEGRATION_GUIDE.md
- Testing examples in TESTING_GUIDE.md

---

**Happy Coding! 🎊**

