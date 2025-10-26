# MyLearnHub Backend API

Backend API for MyLearnHub - A comprehensive learning platform with admin authentication and course management.

## Features

- 🔐 JWT-based Authentication
- 👥 Role-based Access Control (User/Admin)
- 📚 Course Management (CRUD operations)
- 🛡️ Admin-specific endpoints
- ✅ Input validation
- 🚀 RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd MyLearnHub-Backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication Endpoints

#### User/Admin Login
```
POST /api/auth/login
```
Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user" // or "admin"
  }
}
```

#### User Registration
```
POST /api/auth/register
```
Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User Profile
```
GET /api/auth/profile
Authorization: Bearer <token>
```

### Admin Authentication Endpoints

#### Admin Login
```
POST /api/admin/auth/login
```
Same format as user login, but returns admin role.

#### Admin Profile
```
GET /api/admin/auth/profile
Authorization: Bearer <admin_token>
```

### Public Course Endpoints

#### Get All Public Courses
```
GET /api/courses
```

#### Get Course by ID
```
GET /api/courses/:id
```

### Admin Course Management Endpoints

#### Create Course
```
POST /api/admin/courses
Authorization: Bearer <admin_token>
```
Request:
```json
{
  "title": "Course Title",
  "description": "Course description...",
  "instructor": "Instructor Name",
  "duration": "4 weeks",
  "price": 3000,
  "image": "https://example.com/image.jpg",
  "status": "published" // or "draft"
}
```

#### Update Course
```
PUT /api/admin/courses/:id
Authorization: Bearer <admin_token>
```

#### Delete Course
```
DELETE /api/admin/courses/:id
Authorization: Bearer <admin_token>
```

#### Get All Courses (including drafts)
```
GET /api/admin/courses
Authorization: Bearer <admin_token>
```

## Default Admin Credentials

For development/testing purposes, a default admin account is created:
- Email: `admin@mylearnhub.com`
- Password: `Admin@123`

**⚠️ Change these credentials in production!**

## Project Structure

```
MyLearnHub-Backend/
├── config/
│   └── db.js                 # Database configuration
├── models/
│   ├── User.js               # User model
│   └── Course.js             # Course model
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   └── admin.js              # Admin authorization middleware
├── routes/
│   ├── auth.js               # Auth routes
│   ├── courses.js            # Public course routes
│   └── admin/
│       ├── auth.js           # Admin auth routes
│       └── courses.js        # Admin course routes
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── courseController.js   # Course logic
│   └── adminController.js    # Admin logic
├── utils/
│   ├── seedAdmin.js          # Admin seeding utility
│   └── errorResponse.js      # Error handling utility
├── server.js                 # Main server file
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/mylearnhub |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| ADMIN_EMAIL | Default admin email | admin@mylearnhub.com |
| ADMIN_PASSWORD | Default admin password | Admin@123 |

## License

ISC

