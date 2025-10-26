# 📁 Project Structure

```
MyLearnHub Backend/
│
├── 📄 server.js                    # Main application entry point
├── 📄 package.json                 # Project dependencies and scripts
├── 📄 .gitignore                   # Git ignore rules
│
├── 📚 Documentation
│   ├── README.md                   # Project overview and setup
│   ├── QUICK_START.md             # Quick setup guide (5 minutes)
│   ├── API_DOCUMENTATION.md       # Complete API reference
│   ├── INTEGRATION_GUIDE.md       # Frontend integration guide
│   ├── PROJECT_STRUCTURE.md       # This file
│   └── POSTMAN_COLLECTION.json    # Postman API collection
│
├── ⚙️ config/
│   └── db.js                      # MongoDB connection configuration
│
├── 🗃️ models/
│   ├── User.js                    # User schema (authentication, roles)
│   └── Course.js                  # Course schema (course management)
│
├── 🛡️ middleware/
│   ├── auth.js                    # JWT authentication middleware
│   └── admin.js                   # Admin authorization middleware
│
├── 🎮 controllers/
│   ├── authController.js          # Authentication logic (login, register, profile)
│   ├── courseController.js        # Public course operations
│   └── adminController.js         # Admin operations (auth + course management)
│
├── 🛤️ routes/
│   ├── auth.js                    # User authentication routes
│   ├── courses.js                 # Public course routes
│   └── admin/
│       ├── auth.js                # Admin authentication routes
│       └── courses.js             # Admin course management routes
│
└── 🔧 utils/
    ├── errorResponse.js           # Custom error handling utility
    ├── seedAdmin.js               # Admin user seeding script
    ├── seedCourses.js             # Sample courses seeding script
    └── sampleCourses.js           # Sample course data
```

---

## 📂 Directory Details

### `config/`
Configuration files for the application.
- **db.js**: MongoDB connection setup with error handling

### `models/`
Mongoose schemas defining data structures.
- **User.js**: User model with password hashing, role management
- **Course.js**: Course model with all course-related fields

### `middleware/`
Express middleware for request processing.
- **auth.js**: JWT token verification, token generation
- **admin.js**: Admin role verification

### `controllers/`
Business logic for handling requests.
- **authController.js**: 
  - User registration
  - User login
  - Get/update user profile
- **courseController.js**:
  - Get all published courses
  - Get single course details
- **adminController.js**:
  - Admin login
  - Admin profile
  - Create/read/update/delete courses
  - Get all courses (including drafts)

### `routes/`
API endpoint definitions.
- **auth.js**: User authentication endpoints
- **courses.js**: Public course endpoints
- **admin/auth.js**: Admin authentication endpoints
- **admin/courses.js**: Admin course management endpoints

### `utils/`
Utility functions and helpers.
- **errorResponse.js**: Custom error class
- **seedAdmin.js**: Creates default admin user
- **seedCourses.js**: Creates sample courses
- **sampleCourses.js**: Sample course data array

---

## 🔄 Request Flow

### Public Course Request
```
Client Request
    ↓
Express Server (server.js)
    ↓
Route Handler (routes/courses.js)
    ↓
Controller (courseController.js)
    ↓
Model (Course.js)
    ↓
MongoDB
    ↓
Response to Client
```

### Protected User Request
```
Client Request (with JWT token)
    ↓
Express Server
    ↓
Auth Middleware (middleware/auth.js)
    ↓ [Token Verified]
Route Handler (routes/auth.js)
    ↓
Controller (authController.js)
    ↓
Model (User.js)
    ↓
MongoDB
    ↓
Response to Client
```

### Admin Request
```
Client Request (with Admin JWT token)
    ↓
Express Server
    ↓
Auth Middleware (middleware/auth.js)
    ↓ [Token Verified]
Admin Middleware (middleware/admin.js)
    ↓ [Admin Role Verified]
Route Handler (routes/admin/courses.js)
    ↓
Controller (adminController.js)
    ↓
Model (Course.js)
    ↓
MongoDB
    ↓
Response to Client
```

---

## 🗺️ API Route Mapping

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Controller | Middleware | Description |
|--------|----------|------------|------------|-------------|
| POST | `/register` | authController.register | - | Register new user |
| POST | `/login` | authController.login | - | User login |
| GET | `/profile` | authController.getProfile | protect | Get user profile |
| PUT | `/profile` | authController.updateProfile | protect | Update profile |

### Public Course Routes (`/api/courses`)
| Method | Endpoint | Controller | Middleware | Description |
|--------|----------|------------|------------|-------------|
| GET | `/` | courseController.getCourses | - | Get all published courses |
| GET | `/:id` | courseController.getCourse | - | Get course by ID |

### Admin Auth Routes (`/api/admin/auth`)
| Method | Endpoint | Controller | Middleware | Description |
|--------|----------|------------|------------|-------------|
| POST | `/login` | adminController.adminLogin | - | Admin login |
| GET | `/profile` | adminController.getAdminProfile | protect, adminOnly | Get admin profile |

### Admin Course Routes (`/api/admin/courses`)
| Method | Endpoint | Controller | Middleware | Description |
|--------|----------|------------|------------|-------------|
| GET | `/` | adminController.getAllCourses | protect, adminOnly | Get all courses |
| POST | `/` | adminController.createCourse | protect, adminOnly | Create course |
| GET | `/:id` | adminController.getCourseById | protect, adminOnly | Get course by ID |
| PUT | `/:id` | adminController.updateCourse | protect, adminOnly | Update course |
| DELETE | `/:id` | adminController.deleteCourse | protect, adminOnly | Delete course |

---

## 🔐 Authentication Flow

### User/Admin Login
```
1. Client sends credentials → POST /api/auth/login (or /api/admin/auth/login)
2. Server validates credentials
3. Server checks user role
4. Server generates JWT token
5. Server sends token + user data (including role)
6. Client stores token + user data
7. Client includes token in subsequent requests
```

### Protected Request
```
1. Client sends request with Authorization header
2. auth.protect middleware intercepts request
3. Middleware extracts and verifies JWT token
4. Middleware attaches user to request object
5. Request proceeds to route handler
```

### Admin-Only Request
```
1. Client sends request with Authorization header
2. auth.protect middleware verifies token
3. admin.adminOnly middleware checks user role
4. If role === 'admin', request proceeds
5. Otherwise, 403 Forbidden response
```

---

## 🎯 Key Features by File

### User Authentication (`authController.js`)
- ✅ User registration with automatic avatar generation
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token generation
- ✅ Profile retrieval and updates
- ✅ Role-based user data

### Admin Operations (`adminController.js`)
- ✅ Admin-specific login with role verification
- ✅ Full CRUD operations for courses
- ✅ Access to all courses (including drafts)
- ✅ Course filtering by status

### Course Management (`Course.js`)
- ✅ Multiple course statuses (draft, published, archived)
- ✅ Course levels (beginner, intermediate, advanced)
- ✅ Enrollment tracking
- ✅ Rating system
- ✅ Creator tracking

### Security (`middleware/`)
- ✅ JWT token validation
- ✅ Role-based access control
- ✅ Token expiration handling
- ✅ Password encryption
- ✅ Protected routes

---

## 🔧 Environment Configuration

Required environment variables (`.env`):

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mylearnhub

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Admin
ADMIN_EMAIL=admin@mylearnhub.com
ADMIN_PASSWORD=Admin@123
```

---

## 📦 Dependencies

### Production Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **dotenv**: Environment variables
- **cors**: Cross-origin resource sharing
- **express-validator**: Input validation

### Development Dependencies
- **nodemon**: Auto-restart server on changes

---

## 🚀 Scripts

```json
{
  "start": "node server.js",           // Production mode
  "dev": "nodemon server.js"           // Development mode with auto-reload
}
```

---

## 📊 Data Models

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String (auto-generated),
  role: String (user/admin),
  isActive: Boolean,
  timestamps: true
}
```

### Course Schema
```javascript
{
  title: String,
  description: String,
  instructor: String,
  duration: String,
  price: Number,
  image: String,
  status: String (draft/published/archived),
  category: String,
  level: String (beginner/intermediate/advanced),
  enrolledCount: Number,
  rating: Number,
  createdBy: ObjectId (User reference),
  timestamps: true
}
```

---

## 🎨 Sample Data

The application includes 6 sample courses covering:
- Web Development (React.js, JavaScript)
- Backend Development (Node.js)
- Mobile Development (React Native)
- Data Science (Python)
- Design (UI/UX)

These are automatically seeded in development mode on first startup.

---

## 📝 Notes

1. **Admin Creation**: Automatically creates admin user on first server start
2. **Course Seeding**: Sample courses are created only in development mode
3. **JWT Tokens**: Default expiration is 7 days
4. **Role System**: Two roles supported - 'user' and 'admin'
5. **Course Status**: Draft courses are only visible to admins

---

This structure provides a clean, maintainable, and scalable foundation for the MyLearnHub backend API! 🎉

